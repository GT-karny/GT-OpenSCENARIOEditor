import { useCallback } from 'react';
import { useTranslation } from '@osce/i18n';
import { XodrParser } from '@osce/opendrive';
import { buildAssembliesFromDocument } from '@osce/opendrive-engine';
import { FolderOpen } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { EnumSelect } from './EnumSelect';
import { useProjectStore } from '../../stores/project-store';
import { useEditorStore } from '../../stores/editor-store';
import { editorMetadataStoreApi } from '../../stores/editor-metadata-store-instance';
import { useProjectFileOperations } from '../../hooks/use-project-file-operations';

interface XodrFilePickerProps {
  currentPath: string;
  onPathChange: (path: string) => void;
}

export function XodrFilePicker({ currentPath, onPathChange }: XodrFilePickerProps) {
  const { t } = useTranslation('common');
  const currentProject = useProjectStore((s) => s.currentProject);
  const { openXodrFromProject } = useProjectFileOperations();

  const handleProjectSelect = useCallback(
    (path: string) => {
      onPathChange(path);
      if (path) {
        openXodrFromProject(path);
      } else {
        useEditorStore.getState().setRoadNetwork(null);
        useProjectStore.setState({ currentXodrPath: null });
      }
    },
    [onPathChange, openXodrFromProject],
  );

  const handleBrowse = useCallback(async () => {
    try {
      if (window.showOpenFilePicker) {
        const [handle] = await window.showOpenFilePicker({
          types: [
            {
              description: 'OpenDRIVE files',
              accept: { 'application/xml': ['.xodr'] },
            },
          ],
        });
        const file = await handle.getFile();
        const text = await file.text();
        const parser = new XodrParser();
        const doc = parser.parse(text);
        useEditorStore.getState().setRoadNetwork(doc);
        // Reconstruct signal assemblies from signal→object references
        const assemblies = buildAssembliesFromDocument(doc);
        if (assemblies.length > 0) {
          const meta = editorMetadataStoreApi.getState().getMetadata();
          editorMetadataStoreApi.getState().loadMetadata({
            ...meta,
            signalAssemblies: assemblies,
          });
        }
        onPathChange(file.name);
      }
    } catch {
      // User cancelled
    }
  }, [onPathChange]);

  // Project mode: dropdown of .xodr files
  if (currentProject) {
    const xodrFiles = currentProject.files.filter(
      (f) => f.type === 'xodr' && !f.relativePath.startsWith('.trash/'),
    );
    const options = ['', ...xodrFiles.map((f) => f.relativePath)] as const;

    return (
      <div className="grid gap-1">
        <Label className="text-xs">{t('scenario.logicFile')}</Label>
        {xodrFiles.length > 0 ? (
          <EnumSelect
            value={currentPath}
            options={options}
            onValueChange={handleProjectSelect}
            className="h-8 text-sm"
          />
        ) : (
          <p className="text-xs text-muted-foreground py-1">
            {t('scenario.noXodrFiles')}
          </p>
        )}
      </div>
    );
  }

  // Standalone mode: text input + browse button
  return (
    <div className="grid gap-1">
      <Label className="text-xs">{t('scenario.logicFile')}</Label>
      <div className="flex gap-1">
        <Input
          value={currentPath}
          onChange={(e) => onPathChange(e.target.value)}
          placeholder={t('scenario.notConfigured')}
          className="h-8 text-sm flex-1"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleBrowse}
          className="h-8 px-2"
          title={t('scenario.browseFile')}
        >
          <FolderOpen className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
