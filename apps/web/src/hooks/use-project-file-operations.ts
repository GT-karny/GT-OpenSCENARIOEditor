import { useCallback } from 'react';
import { XoscParser } from '@osce/openscenario';
import { XodrParser } from '@osce/opendrive';
import { useTranslation } from '@osce/i18n';
import { toast } from 'sonner';
import { useScenarioStoreApi } from '../stores/use-scenario-store';
import { useEditorStore } from '../stores/editor-store';
import { useProjectStore } from '../stores/project-store';
import { useCatalogStore } from '../stores/catalog-store';
import * as api from '../lib/project-api';

/**
 * Normalize a relative path by resolving `..` segments and converting backslashes.
 */
function normalizePath(path: string): string {
  const parts = path.replace(/\\/g, '/').split('/');
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === '..') {
      resolved.pop();
    } else if (part !== '.' && part !== '') {
      resolved.push(part);
    }
  }
  return resolved.join('/');
}

/**
 * Project-mode file operations hook.
 * Handles opening xosc, xodr, and catalog files from the project file browser.
 */
export function useProjectFileOperations() {
  const { t } = useTranslation('common');
  const scenarioStoreApi = useScenarioStoreApi();

  const openXodrFromProject = useCallback(
    async (relativePath: string) => {
      const project = useProjectStore.getState().currentProject;
      if (!project) return;
      try {
        const content = await api.readProjectFile(project.meta.id, relativePath);
        const parser = new XodrParser();
        const doc = parser.parse(content);
        useEditorStore.getState().setRoadNetwork(doc);
        useProjectStore.setState({ currentXodrPath: relativePath });
      } catch {
        toast.warning(t('warnings.xodrLoadFailed', { path: relativePath }));
      }
    },
    [t],
  );

  const autoLoadXodr = useCallback(
    async (xodrRef: string, xoscRelativePath: string) => {
      const project = useProjectStore.getState().currentProject;
      if (!project) return;

      // Skip empty references
      if (!xodrRef.trim()) {
        useEditorStore.getState().setRoadNetwork(null);
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
        normalizePath(xoscDir ? `${xoscDir}/${xodrRef}` : xodrRef),
        // 2. Relative to project root
        normalizePath(xodrRef),
        // 3. Strip leading ../ and try
        normalizePath(xodrRef.replace(/^(\.\.\/)+/, '')),
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
            useProjectStore.setState({ currentXodrPath: candidate });
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
      useProjectStore.setState({ currentXodrPath: null });
    },
    [t],
  );

  const openXoscFromProject = useCallback(
    async (relativePath: string) => {
      const project = useProjectStore.getState().currentProject;
      if (!project) return;
      try {
        const content = await api.readProjectFile(project.meta.id, relativePath);
        const parser = new XoscParser();
        const doc = parser.parse(content);

        // Load into scenario store
        scenarioStoreApi.getState().createScenario();
        scenarioStoreApi.setState({ document: doc });

        // Update editor state
        const filename = relativePath.split('/').pop() ?? relativePath;
        useEditorStore.getState().setCurrentFileName(filename);
        useEditorStore.getState().setDirty(false);
        useEditorStore.getState().setValidationResult(null);

        // Update project store
        useProjectStore.setState({ currentFilePath: relativePath });

        // Auto-load referenced xodr
        const xodrPath = doc.roadNetwork?.logicFile?.filepath;
        if (xodrPath) {
          await autoLoadXodr(xodrPath, relativePath);
        } else {
          useEditorStore.getState().setRoadNetwork(null);
          useProjectStore.setState({ currentXodrPath: null });
        }
      } catch (err) {
        toast.error(`Failed to open scenario: ${relativePath}`);
      }
    },
    [scenarioStoreApi, autoLoadXodr],
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

  return {
    openXoscFromProject,
    openXodrFromProject,
    openCatalogFromProject,
  };
}
