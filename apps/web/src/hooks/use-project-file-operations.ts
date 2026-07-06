import { useCallback } from 'react';
import { XoscParser } from '@osce/openscenario';
import { XodrParser } from '@osce/opendrive';
import { buildAssembliesFromDocument } from '@osce/opendrive-engine';
import { useTranslation } from '@osce/i18n';
import { toast } from 'sonner';
import { useScenarioStoreApi } from '../stores/use-scenario-store';
import { useEditorStore } from '../stores/editor-store';
import { useDocumentRegistry } from '../stores/document-registry';
import { useProjectStore } from '../stores/project-store';
import { useCatalogStore } from '../stores/catalog-store';
import {
  buildCatalogLocationsFromProject,
  normalizeRelativePath,
} from '../lib/catalog-location-utils';
import { editorMetadataStoreApi } from '../stores/editor-metadata-store-instance';
import { useAppLifecycle } from './use-app-lifecycle';
import { useFileOperations } from './use-file-operations';
import { runUnsavedGuard } from './use-discard-guard';
import { getOpenDriveStoreApi } from './use-opendrive-store';
import * as api from '../lib/project-api';
import { resolveCatalogEntityTypes } from '../lib/resolve-catalog-entity-types';

/** Check if a file path is inside a catalogs directory */
function isCatalogPath(path: string): boolean {
  const lower = path.toLowerCase();
  return lower.startsWith('catalogs/') || lower.includes('/catalogs/');
}

/** Load all catalog xosc files from the current project into the catalog store. */
async function loadProjectCatalogs(): Promise<void> {
  const project = useProjectStore.getState().currentProject;
  if (!project) return;

  const catalogFiles = project.files.filter(
    (f) => f.type === 'xosc' && isCatalogPath(f.relativePath),
  );
  if (catalogFiles.length === 0) return;

  const results = await Promise.allSettled(
    catalogFiles.map(async (f) => {
      const content = await api.readProjectFile(project.meta.id, f.relativePath);
      useCatalogStore.getState().loadCatalog(content, f.relativePath);
    }),
  );

  for (let i = 0; i < results.length; i++) {
    if (results[i].status === 'rejected') {
      console.warn(`[loadProjectCatalogs] Failed to load ${catalogFiles[i].relativePath}`);
    }
  }
}

/**
 * Project-mode file operations hook.
 * Handles opening xosc, xodr, and catalog files from the project file browser.
 */
export function useProjectFileOperations() {
  const { t } = useTranslation('common');
  const scenarioStoreApi = useScenarioStoreApi();
  const { resetForNewFile, resetForNewRoadNetwork } = useAppLifecycle();
  const { saveXosc, saveXodr } = useFileOperations();

  // Gate a user-initiated project open behind the shared unsaved-changes guard,
  // saving via the current save flows on "Save". Chained loads (e.g. a scenario's
  // auto-loaded xodr) are part of the same user action and must not re-prompt.
  const guardOpen = useCallback(
    () => runUnsavedGuard({ saveXosc, saveXodr }),
    [saveXosc, saveXodr],
  );

  const openXodrFromProject = useCallback(
    async (relativePath: string, options?: { skipGuard?: boolean }) => {
      const project = useProjectStore.getState().currentProject;
      if (!project) return;
      if (!options?.skipGuard && !(await guardOpen())) return;
      try {
        const content = await api.readProjectFile(project.meta.id, relativePath);
        const parser = new XodrParser();
        const doc = parser.parse(content);
        resetForNewRoadNetwork();
        useEditorStore.getState().setRoadNetwork(doc);
        // Provisional stamp: the odr history has not moved yet, so tagging the
        // verbatim text with the current revision keeps it on the lossless
        // simulation path until road-mode entry re-stamps after auto-correction.
        useEditorStore.getState().setRoadNetworkRawXml({
          text: content,
          validForRevision: getOpenDriveStoreApi().getState().getCommandHistory().getRevision(),
        });
        useProjectStore.setState({ currentXodrPath: relativePath });
        // Reconstruct signal assemblies from signal→object references
        const assemblies = buildAssembliesFromDocument(doc);
        if (assemblies.length > 0) {
          const meta = editorMetadataStoreApi.getState().getMetadata();
          editorMetadataStoreApi.getState().loadMetadata({
            ...meta,
            signalAssemblies: assemblies,
          });
        }
      } catch {
        toast.warning(t('warnings.xodrLoadFailed', { path: relativePath }));
      }
    },
    [guardOpen, resetForNewRoadNetwork, t],
  );

  const autoLoadXodr = useCallback(
    async (xodrRef: string, xoscRelativePath: string) => {
      const project = useProjectStore.getState().currentProject;
      if (!project) return;

      // Skip empty references
      if (!xodrRef.trim()) {
        useEditorStore.getState().setRoadNetwork(null);
        useEditorStore.getState().setRoadNetworkRawXml(null);
        useProjectStore.setState({ currentXodrPath: null });
        return;
      }

      // Build candidate paths in priority order
      const xoscDir = xoscRelativePath.includes('/')
        ? xoscRelativePath.substring(0, xoscRelativePath.lastIndexOf('/'))
        : '';

      const basename = xodrRef.split('/').pop() ?? xodrRef;
      const candidates = [
        // 1. Relative to xosc file directory
        normalizeRelativePath(xoscDir ? `${xoscDir}/${xodrRef}` : xodrRef),
        // 2. Relative to project root
        normalizeRelativePath(xodrRef),
        // 3. Strip leading ../ and try
        normalizeRelativePath(xodrRef.replace(/^(\.\.\/)+/, '')),
        // 4. Look in xodr/ folder by filename
        `xodr/${basename}`,
      ];

      // Deduplicate
      const seen = new Set<string>();
      const uniqueCandidates = candidates.filter((c) => {
        if (seen.has(c)) return false;
        seen.add(c);
        return true;
      });

      const projectFiles = project.files;

      for (const candidate of uniqueCandidates) {
        const exists = projectFiles.some((f) => f.relativePath === candidate);
        if (exists) {
          try {
            const content = await api.readProjectFile(project.meta.id, candidate);
            const parser = new XodrParser();
            const doc = parser.parse(content);
            useEditorStore.getState().setRoadNetwork(doc);
            // Provisional stamp (see openXodrFromProject): keeps the verbatim text
            // on the lossless simulation path until road-mode entry re-stamps.
            useEditorStore.getState().setRoadNetworkRawXml({
              text: content,
              validForRevision: getOpenDriveStoreApi().getState().getCommandHistory().getRevision(),
            });
            useProjectStore.setState({ currentXodrPath: candidate });
            // Reconstruct signal assemblies from signal→object references
            const assemblies = buildAssembliesFromDocument(doc);
            if (assemblies.length > 0) {
              const meta = editorMetadataStoreApi.getState().getMetadata();
              editorMetadataStoreApi.getState().loadMetadata({
                ...meta,
                signalAssemblies: assemblies,
              });
            }
            return;
          } catch {
            toast.warning(t('warnings.xodrLoadFailed', { path: candidate }));
            return;
          }
        }
      }

      // Not found
      toast.warning(t('warnings.xodrNotFound', { path: xodrRef }));
      useEditorStore.getState().setRoadNetwork(null);
      useEditorStore.getState().setRoadNetworkRawXml(null);
      useProjectStore.setState({ currentXodrPath: null });
    },
    [t],
  );

  const openXoscFromProject = useCallback(
    async (relativePath: string, options?: { skipGuard?: boolean }) => {
      const project = useProjectStore.getState().currentProject;
      if (!project) return;
      if (!options?.skipGuard && !(await guardOpen())) return;
      try {
        resetForNewFile();
        const content = await api.readProjectFile(project.meta.id, relativePath);
        const parser = new XoscParser();
        const doc = parser.parse(content);

        // Auto-populate CatalogLocations from project catalog folders if empty
        const hasCatalogLocations = Object.keys(doc.catalogLocations).length > 0;
        if (!hasCatalogLocations) {
          doc.catalogLocations = buildCatalogLocationsFromProject(
            project.files,
            relativePath,
          );
        }

        // Re-load project catalogs (resetForNewFile clears them)
        await loadProjectCatalogs();

        // Load into scenario store
        scenarioStoreApi.getState().createScenario();
        scenarioStoreApi.setState({ document: doc });

        // Resolve entity types from loaded catalogs
        resolveCatalogEntityTypes(scenarioStoreApi);

        // Update editor state
        const filename = relativePath.split('/').pop() ?? relativePath;
        useEditorStore.getState().setCurrentFileName(filename);
        // Loaded document = clean baseline (createScenario cleared history).
        useDocumentRegistry.getState().markLoaded('scenario');
        useEditorStore.getState().setValidationResult(null);

        // Update project store
        useProjectStore.setState({ currentFilePath: relativePath });

        // Auto-load referenced xodr
        const xodrPath = doc.roadNetwork?.logicFile?.filepath;
        if (xodrPath) {
          await autoLoadXodr(xodrPath, relativePath);
        } else {
          useEditorStore.getState().setRoadNetwork(null);
          useEditorStore.getState().setRoadNetworkRawXml(null);
          useProjectStore.setState({ currentXodrPath: null });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('Open scenario failed:', err);
        toast.error(t('fileErrors.openXoscFailed', { message }));
      }
    },
    [guardOpen, resetForNewFile, scenarioStoreApi, autoLoadXodr, t],
  );

  const openCatalogFromProject = useCallback(
    async (relativePath: string) => {
      const project = useProjectStore.getState().currentProject;
      if (!project) return;
      try {
        const content = await api.readProjectFile(project.meta.id, relativePath);
        const doc = useCatalogStore.getState().loadCatalog(content, relativePath);
        useCatalogStore.getState().selectCatalog(doc.catalogName);
        useCatalogStore.getState().openEditor();
      } catch {
        toast.warning(t('warnings.catalogLoadFailed', { path: relativePath }));
      }
    },
    [t],
  );

  const autoLoadProjectCatalogs = useCallback(
    async () => {
      await loadProjectCatalogs();
      // Resolve entity types now that catalogs are loaded
      resolveCatalogEntityTypes(scenarioStoreApi);
    },
    [scenarioStoreApi],
  );

  return {
    openXoscFromProject,
    openXodrFromProject,
    openCatalogFromProject,
    autoLoadProjectCatalogs,
  };
}
