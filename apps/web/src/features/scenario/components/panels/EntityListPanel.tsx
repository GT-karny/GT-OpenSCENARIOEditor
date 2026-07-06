import { useState, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Plus, Shuffle } from 'lucide-react';
import { useTranslation } from '@osce/i18n';
import { findEntityRefUsages } from '@osce/scenario-engine';
import type { EntityRefUsage, EntityCleanupOption } from '@osce/scenario-engine';
import {
  pickRandomPresetColor,
  readEntityColor,
  supportsEntityColor,
  writeEntityColor,
} from '@osce/shared';
import { Button } from '../../../../components/ui/button';
import { ScrollArea } from '../../../../components/ui/scroll-area';
import { EntityListItem } from '../entity/EntityListItem';
import { AddEntityDialog } from '../entity/AddEntityDialog';
import { DeleteEntityDialog } from '../entity/DeleteEntityDialog';
import { RandomizeColorsDialog } from '../entity/RandomizeColorsDialog';
import { useScenarioStore, useScenarioStoreApi } from '../../../../stores/use-scenario-store';
import { useEditorStore } from '../../../../stores/editor-store';

interface DeleteTarget {
  id: string;
  name: string;
  usages: EntityRefUsage[];
  availableEntities: string[];
}

export function EntityListPanel() {
  const entities = useScenarioStore(useShallow((s) => s.document.entities));
  const selectedIds = useEditorStore(useShallow((s) => s.selection.selectedElementIds));
  const setSelection = useEditorStore((s) => s.setSelection);
  const storeApi = useScenarioStoreApi();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [randomizeDialogOpen, setRandomizeDialogOpen] = useState(false);
  const { t } = useTranslation('common');

  const applyRandomColors = useCallback(
    (overwriteExisting: boolean) => {
      const state = storeApi.getState();
      const updateEntity = state.updateEntity;
      for (const e of state.document.entities) {
        if (!supportsEntityColor(e)) continue;
        const hasColor = readEntityColor(e) !== undefined;
        if (hasColor && !overwriteExisting) continue;
        const next = writeEntityColor(e, pickRandomPresetColor(readEntityColor(e)));
        updateEntity(e.id, { definition: next.definition });
      }
      setRandomizeDialogOpen(false);
    },
    [storeApi],
  );

  const handleRandomizeClick = useCallback(() => {
    const coloredCount = entities.filter((e) => supportsEntityColor(e) && readEntityColor(e)).length;
    if (coloredCount === 0) {
      applyRandomColors(true);
    } else {
      setRandomizeDialogOpen(true);
    }
  }, [entities, applyRandomColors]);

  const coloredCount = entities.filter((e) => supportsEntityColor(e) && readEntityColor(e)).length;

  const executeDelete = useCallback(
    (id: string, cleanupOption?: EntityCleanupOption) => {
      storeApi.getState().removeEntity(id, cleanupOption);
      if (selectedIds.includes(id)) {
        setSelection({ selectedElementIds: selectedIds.filter((eid) => eid !== id) });
      }
    },
    [storeApi, selectedIds, setSelection],
  );

  const handleDelete = useCallback(
    (id: string) => {
      const state = storeApi.getState();
      const entity = state.document.entities.find((e) => e.id === id);
      if (!entity) return;

      // Check for entityRef usages (excluding init.entityActions which are always cleaned up)
      const usages = findEntityRefUsages(state.document, entity.name).filter(
        (u) => u.type !== 'initAction',
      );

      if (usages.length === 0) {
        // No references — delete directly
        executeDelete(id);
      } else {
        // Show dialog for user to choose cleanup action
        const availableEntities = state.document.entities
          .filter((e) => e.id !== id)
          .map((e) => e.name);
        setDeleteTarget({ id, name: entity.name, usages, availableEntities });
      }
    },
    [storeApi, executeDelete],
  );

  const handleDeleteConfirm = useCallback(
    (option: EntityCleanupOption) => {
      if (!deleteTarget) return;
      executeDelete(deleteTarget.id, option);
      setDeleteTarget(null);
    },
    [deleteTarget, executeDelete],
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          aria-label={t('entityColor.randomizeAll')}
          title={t('entityColor.randomizeTooltip')}
          onClick={handleRandomizeClick}
          disabled={entities.length === 0}
        >
          <Shuffle className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Add new entity" onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="divider-glow" />

      <ScrollArea className="flex-1">
        {entities.map((entity) => (
          <EntityListItem
            key={entity.id}
            entity={entity}
            selected={selectedIds.includes(entity.id)}
            onSelect={() => setSelection({ selectedElementIds: [entity.id] })}
            onDoubleClick={() => useEditorStore.getState().setFocusEntityId(entity.id)}
            onDelete={() => handleDelete(entity.id)}
          />
        ))}
        {entities.length === 0 && (
          <p className="p-4 text-center text-xs text-muted-foreground">
            No entities. Click + to add.
          </p>
        )}
      </ScrollArea>

      <AddEntityDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />

      <RandomizeColorsDialog
        open={randomizeDialogOpen}
        coloredCount={coloredCount}
        onOpenChange={setRandomizeDialogOpen}
        onOverwriteAll={() => applyRandomColors(true)}
        onUnsetOnly={() => applyRandomColors(false)}
      />

      {deleteTarget && (
        <DeleteEntityDialog
          open
          onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
          entityName={deleteTarget.name}
          usages={deleteTarget.usages}
          availableEntities={deleteTarget.availableEntities}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
