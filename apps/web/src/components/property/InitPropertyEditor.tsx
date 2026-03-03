import type { EntityInitActions, TeleportAction, SpeedAction, Position } from '@osce/shared';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Plus } from 'lucide-react';
import { PositionEditor } from './PositionEditor';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';
import { createDefaultPosition } from '../../constants/position-defaults';

interface InitPropertyEditorProps {
  entityInit: EntityInitActions;
}

export function InitPropertyEditor({ entityInit }: InitPropertyEditorProps) {
  const storeApi = useScenarioStoreApi();
  const { entityRef, privateActions } = entityInit;

  const teleportAction = privateActions.find(
    (pa) => pa.action.type === 'teleportAction',
  );
  const currentPosition = teleportAction
    ? (teleportAction.action as TeleportAction).position
    : null;

  const speedActionEntry = privateActions.find(
    (pa) => pa.action.type === 'speedAction',
  );
  const speedAction = speedActionEntry
    ? (speedActionEntry.action as SpeedAction)
    : null;
  const currentSpeed =
    speedAction?.target.kind === 'absolute' ? speedAction.target.value : null;

  const handlePositionChange = (position: Position) => {
    storeApi.getState().setInitPosition(entityRef, position);
  };

  const handleAddPosition = () => {
    storeApi.getState().setInitPosition(entityRef, createDefaultPosition('lanePosition'));
  };

  const handleSpeedChange = (value: string) => {
    const n = Number(value);
    if (Number.isFinite(n)) {
      storeApi.getState().setInitSpeed(entityRef, n);
    }
  };

  const handleAddSpeed = () => {
    storeApi.getState().setInitSpeed(entityRef, 0);
  };

  return (
    <div className="flex flex-col gap-5 p-1">
      {/* Entity name */}
      <div className="pb-2 border-b">
        <p className="text-sm font-medium">{entityRef}</p>
        <p className="text-xs text-muted-foreground">Initial State</p>
      </div>

      {/* Position section */}
      <section className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Position
        </p>
        {currentPosition ? (
          <PositionEditor position={currentPosition} onChange={handlePositionChange} />
        ) : (
          <button
            onClick={handleAddPosition}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent-1)] hover:bg-[var(--color-glass-2)] transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add Position
          </button>
        )}
      </section>

      {/* Speed section */}
      <section className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Speed
        </p>
        {currentSpeed !== null ? (
          <div className="grid gap-2">
            <Label className="text-xs">Absolute Speed (m/s)</Label>
            <Input
              type="number"
              value={currentSpeed}
              onChange={(e) => handleSpeedChange(e.target.value)}
              className="h-8 text-sm"
              step="any"
            />
          </div>
        ) : speedAction?.target.kind === 'relative' ? (
          <p className="text-xs text-muted-foreground italic">
            Relative speed target (editing not yet supported)
          </p>
        ) : (
          <button
            onClick={handleAddSpeed}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent-1)] hover:bg-[var(--color-glass-2)] transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add Speed
          </button>
        )}
      </section>
    </div>
  );
}
