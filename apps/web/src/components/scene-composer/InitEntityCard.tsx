import { Crosshair } from 'lucide-react';
import type { EntityInitActions, TeleportAction, SpeedAction } from '@osce/shared';
import { cn } from '../../lib/utils';

interface InitEntityCardProps {
  entityInit: EntityInitActions;
  selected: boolean;
  onSelect: () => void;
}

function getPositionSummary(entityInit: EntityInitActions): string {
  const teleport = entityInit.privateActions.find(
    (pa) => pa.action.type === 'teleportAction',
  );
  if (!teleport) return 'No position';
  const pos = (teleport.action as TeleportAction).position;
  switch (pos.type) {
    case 'lanePosition':
      return `Lane ${pos.laneId}, Road ${pos.roadId}, s=${pos.s}`;
    case 'worldPosition':
      return `World (${pos.x}, ${pos.y}${pos.z !== undefined ? `, ${pos.z}` : ''})`;
    case 'roadPosition':
      return `Road ${pos.roadId}, s=${pos.s}, t=${pos.t}`;
    case 'relativeRoadPosition':
      return `RelRoad ${pos.entityRef} ds=${pos.ds}, dt=${pos.dt}`;
    case 'relativeLanePosition':
      return `RelLane ${pos.entityRef} dLane=${pos.dLane}`;
    case 'relativeObjectPosition':
      return `RelObj ${pos.entityRef} (${pos.dx}, ${pos.dy})`;
    case 'relativeWorldPosition':
      return `RelWorld ${pos.entityRef} (${pos.dx}, ${pos.dy})`;
    case 'geoPosition':
      return `Geo (${pos.latitude}, ${pos.longitude})`;
    case 'routePosition':
      return 'Route position';
    default:
      return 'Position';
  }
}

function getSpeedSummary(entityInit: EntityInitActions): string {
  const speed = entityInit.privateActions.find(
    (pa) => pa.action.type === 'speedAction',
  );
  if (!speed) return 'No speed';
  const sa = speed.action as SpeedAction;
  if (sa.target.kind === 'absolute') {
    return `${sa.target.value} m/s`;
  }
  return `relative to ${sa.target.entityRef}`;
}

/**
 * Card displaying an entity's Init state (position + speed) in the Composer view.
 * Visually distinct from EntityBehaviorCard via left border accent.
 */
export function InitEntityCard({ entityInit, selected, onSelect }: InitEntityCardProps) {
  const posLabel = getPositionSummary(entityInit);
  const speedLabel = getSpeedSummary(entityInit);

  return (
    <div
      className={cn(
        'glass-item flex flex-col w-72 shrink-0 border-l-2 border-l-[var(--color-accent-vivid)]/60',
        selected && 'selected',
      )}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-3 pb-2">
        <Crosshair className="h-3.5 w-3.5 shrink-0 text-[var(--color-accent-vivid)]" />
        <span className="text-sm font-medium truncate">{entityInit.entityRef}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-accent-vivid)]/15 text-[var(--color-accent-vivid)] font-medium shrink-0">
          Init
        </span>
      </div>

      {/* Init summary rows */}
      <div className="px-3 pb-3 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--color-text-muted)] w-14 shrink-0">Position</span>
          <span className="text-[11px] font-mono text-[var(--color-text-primary)] truncate">
            {posLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--color-text-muted)] w-14 shrink-0">Speed</span>
          <span className="text-[11px] font-mono text-[var(--color-text-primary)] truncate">
            {speedLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
