/**
 * Property editor for TrafficSignalController management.
 * Shown in the Properties panel when the Signals timeline is open.
 * Provides: controller list, add/delete, name/delay/reference editing.
 */

import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Plus, Trash2, TrafficCone } from 'lucide-react';
import type { TrafficSignalController } from '@osce/shared';
import { useScenarioStore, useScenarioStoreApi } from '../../stores/use-scenario-store';
import { useEditorStore } from '../../stores/editor-store';

export function SignalControllerPropertyEditor() {
  const storeApi = useScenarioStoreApi();
  const controllers = useScenarioStore(
    useShallow(
      (s) => (s.document.roadNetwork?.trafficSignals ?? []) as TrafficSignalController[],
    ),
  );
  const selectedControllerId = useEditorStore((s) => s.selectedControllerId);
  const setSelectedControllerId = useEditorStore((s) => s.setSelectedControllerId);

  const selectedController =
    controllers.find((c) => c.id === selectedControllerId) ?? null;

  // --- CRUD ---

  const handleAdd = useCallback(() => {
    const doc = storeApi.getState().document;
    const signals = (doc.roadNetwork?.trafficSignals ?? []) as TrafficSignalController[];
    const id = crypto.randomUUID();
    const newController: TrafficSignalController = {
      id,
      name: `Controller_${signals.length + 1}`,
      phases: [],
    };
    storeApi.getState().updateRoadNetwork({ trafficSignals: [...signals, newController] });
    setSelectedControllerId(id);
  }, [storeApi, setSelectedControllerId]);

  const handleDelete = useCallback(
    (controllerId: string) => {
      const doc = storeApi.getState().document;
      const signals = (doc.roadNetwork?.trafficSignals ?? []) as TrafficSignalController[];
      const newSignals = signals.filter((c) => c.id !== controllerId);
      storeApi.getState().updateRoadNetwork({ trafficSignals: newSignals });
      if (selectedControllerId === controllerId) {
        setSelectedControllerId(newSignals[0]?.id ?? null);
      }
    },
    [storeApi, selectedControllerId, setSelectedControllerId],
  );

  const handleUpdate = useCallback(
    (updates: Partial<Pick<TrafficSignalController, 'name' | 'delay' | 'reference'>>) => {
      if (!selectedControllerId) return;
      const doc = storeApi.getState().document;
      const signals = (doc.roadNetwork?.trafficSignals ?? []) as TrafficSignalController[];
      const newSignals = signals.map((c) =>
        c.id === selectedControllerId ? { ...c, ...updates } : c,
      );
      storeApi.getState().updateRoadNetwork({ trafficSignals: newSignals });
    },
    [storeApi, selectedControllerId],
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-glass-edge)]">
        <TrafficCone className="h-5 w-5 text-amber-400 shrink-0" />
        <p className="text-sm font-medium">Signal Controllers</p>
      </div>

      {/* Controller list */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider">
            Controllers
          </span>
          <button
            type="button"
            onClick={handleAdd}
            title="Add controller"
            className="flex items-center gap-0.5 text-[10px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <Plus className="size-3" />
            Add
          </button>
        </div>

        {controllers.length === 0 ? (
          <p className="text-xs text-[var(--color-text-secondary)] py-2">
            No controllers. Click "Add" to create one.
          </p>
        ) : (
          <div className="space-y-0.5">
            {controllers.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedControllerId(c.id)}
                className={`glass-item flex items-center justify-between w-full px-2 py-1.5 text-xs text-left transition-colors ${
                  selectedControllerId === c.id ? 'selected' : ''
                }`}
              >
                <span className="truncate">{c.name}</span>
                <span className="text-[10px] text-[var(--color-text-secondary)] shrink-0 ml-2">
                  {c.phases.length}ph
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected controller properties */}
      {selectedController && (
        <div className="space-y-3 pt-2 border-t border-[var(--color-glass-edge)]">
          <span className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider">
            Properties
          </span>

          {/* Name */}
          <div className="space-y-0.5">
            <label className="text-[10px] text-[var(--color-text-secondary)]">Name</label>
            <input
              type="text"
              value={selectedController.name}
              onChange={(e) => handleUpdate({ name: e.target.value })}
              className="h-7 w-full px-2 text-xs bg-[var(--color-glass-2)] border border-[var(--color-glass-edge)] rounded-none text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          {/* Delay */}
          <div className="space-y-0.5">
            <label className="text-[10px] text-[var(--color-text-secondary)]">Delay (s)</label>
            <input
              type="number"
              value={selectedController.delay ?? ''}
              placeholder="--"
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                handleUpdate({ delay: isNaN(v) ? undefined : v });
              }}
              className="h-7 w-full px-2 text-xs bg-[var(--color-glass-2)] border border-[var(--color-glass-edge)] rounded-none text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
              step={1}
              min={0}
            />
          </div>

          {/* Reference */}
          <div className="space-y-0.5">
            <label className="text-[10px] text-[var(--color-text-secondary)]">Reference</label>
            <input
              type="text"
              value={selectedController.reference ?? ''}
              placeholder="--"
              onChange={(e) => handleUpdate({ reference: e.target.value || undefined })}
              className="h-7 w-full px-2 text-xs bg-[var(--color-glass-2)] border border-[var(--color-glass-edge)] rounded-none text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          {/* Delete */}
          <div className="pt-2 border-t border-[var(--color-glass-edge)]">
            <button
              type="button"
              onClick={() => handleDelete(selectedController.id)}
              className="flex items-center gap-1 text-[10px] text-[var(--color-status-error)] hover:text-[var(--color-status-error)]/80 transition-colors"
            >
              <Trash2 className="size-3" />
              Delete controller
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
