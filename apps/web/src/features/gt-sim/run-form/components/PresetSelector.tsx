/**
 * Preset tab strip: select/save/update/delete named parameter-override sets,
 * with a live "changed externally" banner fed by the presets WS stream.
 *
 * Ported from the GT_Sim fork's `components/project/PresetSelector.tsx`.
 * `usePresetWatcher` now wraps `@osce/esmini`'s `GtSimPresetsClient` instead
 * of a raw same-origin `WebSocket` (see `../hooks/use-preset-watcher`).
 * Mutations are no-ops (disabled buttons) while `useGtSimApi()` is `null`
 * (backend not connected) instead of throwing.
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@osce/i18n';
import type { ParameterPreset } from '@osce/esmini';
import { useGtSimApi } from '../../lib';
import { TextInput, Button, ConfirmDialog } from '../../ui';
import { usePresetWatcher } from '../hooks/use-preset-watcher';

interface PresetSelectorProps {
  projectId: string;
  scenarioFile: string;
  presets: ParameterPreset[];
  currentValues: Record<string, string>;
  defaultValues: Record<string, string>;
  onLoad: (values: Record<string, string>) => void;
  disabled?: boolean;
}

export function PresetSelector({
  projectId,
  scenarioFile,
  presets,
  currentValues,
  defaultValues,
  onLoad,
  disabled = false,
}: PresetSelectorProps) {
  const { t } = useTranslation('common');
  const api = useGtSimApi();
  const queryClient = useQueryClient();
  const [activePresetId, setActivePresetId] = useState<string | null>(null); // null = "Default"
  const [showNewInput, setShowNewInput] = useState(false);
  const [newName, setNewName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ParameterPreset | null>(null);
  const [manageMode, setManageMode] = useState(false);

  const invalidatePresets = () =>
    queryClient.invalidateQueries({ queryKey: ['presets', projectId, scenarioFile] });

  // External edit watcher: shows banner; Reload re-applies the active preset
  // (or scenario defaults) using the freshly fetched values.
  const { externalChangePending, clearPending } = usePresetWatcher({ projectId, scenarioFile });

  const handleReloadFromFile = async () => {
    clearPending();
    if (!api) return;
    const fresh = await queryClient.fetchQuery({
      queryKey: ['presets', projectId, scenarioFile],
      queryFn: () => api.getPresets(projectId, scenarioFile),
    });
    if (activePresetId === null) {
      onLoad(defaultValues);
      return;
    }
    const target = fresh.find((p) => p.preset_id === activePresetId);
    if (target) {
      onLoad({ ...defaultValues, ...target.values });
    } else {
      // Active preset was deleted externally — fall back to defaults.
      setActivePresetId(null);
      onLoad(defaultValues);
    }
  };

  const createMut = useMutation({
    mutationFn: () => {
      if (!api) throw new Error('GT_Sim backend not connected');
      return api.createPreset(projectId, scenarioFile, newName.trim(), currentValues);
    },
    onSuccess: (created) => {
      setShowNewInput(false);
      setNewName('');
      setActivePresetId(created.preset_id);
      invalidatePresets();
    },
  });

  const updateMut = useMutation({
    mutationFn: (presetId: string) => {
      if (!api) throw new Error('GT_Sim backend not connected');
      return api.updatePreset(projectId, scenarioFile, presetId, { values: currentValues });
    },
    onSuccess: () => invalidatePresets(),
  });

  const deleteMut = useMutation({
    mutationFn: (presetId: string) => {
      if (!api) throw new Error('GT_Sim backend not connected');
      return api.deletePreset(projectId, scenarioFile, presetId);
    },
    onSuccess: () => {
      if (deleteTarget && activePresetId === deleteTarget.preset_id) {
        setActivePresetId(null);
        onLoad(defaultValues);
      }
      setDeleteTarget(null);
      invalidatePresets();
    },
  });

  // Check if current values match a given set.
  const valuesMatch = (a: Record<string, string>, b: Record<string, string>): boolean => {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
      if ((a[k] ?? '') !== (b[k] ?? '')) return false;
    }
    return true;
  };

  const activePreset = presets.find((p) => p.preset_id === activePresetId);
  const activeValues = activePreset?.values ?? defaultValues;
  const hasChanges = !valuesMatch(currentValues, activeValues);

  const handleSelectDefault = () => {
    setActivePresetId(null);
    onLoad(defaultValues);
  };

  const handleSelectPreset = (preset: ParameterPreset) => {
    setActivePresetId(preset.preset_id);
    onLoad({ ...defaultValues, ...preset.values });
  };

  const handleReset = () => {
    onLoad(activeValues);
  };

  const handleSaveNew = () => {
    if (disabled || !api) return;
    if (newName.trim()) createMut.mutate();
  };

  if (disabled) {
    return null;
  }

  return (
    <div className="mb-3">
      {/* External edit notification */}
      {externalChangePending && (
        <div className="mb-2 px-2 py-1.5 bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/40 text-[10px] text-[var(--color-warning)] flex items-center justify-between gap-2">
          <span>{t('gtSim.presets.externalChange.message')}</span>
          <button
            type="button"
            onClick={handleReloadFromFile}
            className="px-1.5 py-0.5 text-[10px] bg-[var(--color-warning)]/20 hover:bg-[var(--color-warning)]/30 text-[var(--color-warning)] cursor-pointer"
          >
            {t('gtSim.presets.externalChange.reload')}
          </button>
        </div>
      )}

      {/* Tabs row */}
      <div className="flex items-center gap-0.5 flex-wrap border-b border-[var(--color-glass-edge)] mb-2">
        {/* Default tab */}
        <TabButton
          active={activePresetId === null && !hasChanges}
          modified={activePresetId === null && hasChanges}
          label={t('gtSim.presets.defaultTab')}
          onClick={handleSelectDefault}
          manageMode={false}
        />

        {/* Preset tabs */}
        {presets.map((p) => {
          const isActive = activePresetId === p.preset_id;
          const isModified = isActive && hasChanges;
          return (
            <TabButton
              key={p.preset_id}
              active={isActive && !isModified}
              modified={isModified}
              label={p.name}
              onClick={() => handleSelectPreset(p)}
              manageMode={manageMode}
              onDelete={() => setDeleteTarget(p)}
              deleteTooltip={t('gtSim.presets.deleteTooltip')}
            />
          );
        })}

        {/* Add tab */}
        {!showNewInput && (
          <button
            type="button"
            onClick={() => setShowNewInput(true)}
            className="px-2 py-1.5 text-[10px] text-[var(--color-text-tertiary)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-glass-hover)] transition-colors cursor-pointer"
            title={t('gtSim.presets.addTooltip')}
          >
            +
          </button>
        )}

        {/* Manage toggle */}
        {presets.length > 0 && (
          <button
            type="button"
            onClick={() => setManageMode((v) => !v)}
            className={`ml-auto px-1.5 py-1 text-[9px] transition-colors cursor-pointer ${
              manageMode
                ? 'text-[var(--color-accent-vivid)]'
                : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
            }`}
            title={manageMode ? t('gtSim.presets.done') : t('gtSim.presets.manage')}
          >
            {manageMode ? t('gtSim.presets.done') : t('gtSim.presets.manage')}
          </button>
        )}
      </div>

      {/* New preset input */}
      {showNewInput && (
        <div className="flex items-center gap-2 mb-2">
          <TextInput
            placeholder={t('gtSim.presets.namePlaceholder')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="text-xs"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveNew();
              if (e.key === 'Escape') {
                setShowNewInput(false);
                setNewName('');
              }
            }}
          />
          <Button
            variant="primary"
            size="sm"
            disabled={!newName.trim() || createMut.isPending || !api}
            onClick={handleSaveNew}
          >
            {t('buttons.save')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowNewInput(false);
              setNewName('');
            }}
          >
            {t('buttons.cancel')}
          </Button>
        </div>
      )}

      {/* Save / Reset actions when active preset has changes */}
      {hasChanges && activePresetId && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] text-[var(--color-warning)]">
            {t('gtSim.presets.modified')}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateMut.mutate(activePresetId)}
            disabled={updateMut.isPending || !api}
          >
            {t('buttons.save')}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            {t('buttons.reset')}
          </Button>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={t('gtSim.presets.deleteDialog.title')}
        message={t('gtSim.presets.deleteDialog.message', { name: deleteTarget?.name ?? '' })}
        confirmLabel={t('buttons.delete')}
        variant="danger"
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.preset_id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function TabButton({
  active,
  modified,
  label,
  onClick,
  manageMode,
  onDelete,
  deleteTooltip,
}: {
  active: boolean;
  modified: boolean;
  label: string;
  onClick: () => void;
  manageMode: boolean;
  onDelete?: () => void;
  deleteTooltip?: string;
}) {
  return (
    <div className="relative flex items-center">
      <button
        type="button"
        onClick={onClick}
        className={`px-2.5 py-1.5 text-[10px] font-medium transition-colors cursor-pointer border-b-2 ${
          active
            ? 'text-[var(--color-foreground)] bg-[var(--color-glass-active)] border-[var(--color-accent-vivid)]'
            : modified
              ? 'text-[var(--color-foreground)] border-[var(--color-warning)]/60'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-glass-hover)] border-transparent'
        }`}
      >
        {label}
        {modified && <span className="text-[var(--color-warning)] ml-0.5">*</span>}
      </button>
      {manageMode && onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[var(--color-destructive)]/80 text-[var(--color-bg-void)] text-[8px] leading-none flex items-center justify-center hover:bg-[var(--color-destructive)] cursor-pointer"
          title={deleteTooltip}
        >
          &times;
        </button>
      )}
    </div>
  );
}
