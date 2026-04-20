import type { Orientation, Position, TrajectoryVertex, WorldPosition } from '@osce/shared';
import { ChevronDown, ChevronRight, Lock, Trash2 } from 'lucide-react';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { SegmentedControl } from '../SegmentedControl';
import { OrientationFields } from '../PositionEditor';

export interface TrajectoryVertexListItemProps {
  index: number;
  vertex: TrajectoryVertex;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onTimeChange: (time: number | undefined) => void;
  /** Whether this vertex is expanded to show orientation fields */
  expanded?: boolean;
  /** Callback when orientation changes (from OrientationFields) */
  onOrientationChange?: (orientation: Orientation | undefined) => void;
  /** Element ID for parameter binding */
  elementId?: string;
  /** Lock the vertex (prevent delete, show lock icon) */
  isLocked?: boolean;
  /** Override position display text for locked vertices */
  lockedLabel?: string;
}

function formatPosition(position: Position): string {
  switch (position.type) {
    case 'lanePosition':
      return `Road ${position.roadId}, Lane ${position.laneId}, s=${position.s.toFixed(1)}`;
    case 'worldPosition':
      return `(${position.x.toFixed(1)}, ${position.y.toFixed(1)})`;
    case 'roadPosition':
      return `Road ${position.roadId}, s=${position.s.toFixed(1)}, t=${position.t.toFixed(1)}`;
    case 'relativeLanePosition':
      return `Rel ${position.entityRef} dLane=${position.dLane}`;
    case 'relativeRoadPosition':
      return `Rel ${position.entityRef} ds=${position.ds.toFixed(1)}`;
    case 'relativeObjectPosition':
      return `Rel ${position.entityRef} (${position.dx.toFixed(1)}, ${position.dy.toFixed(1)})`;
    case 'relativeWorldPosition':
      return `Rel ${position.entityRef} (${position.dx.toFixed(1)}, ${position.dy.toFixed(1)})`;
    case 'geoPosition':
      return `Geo (${position.latitude.toFixed(4)}, ${position.longitude.toFixed(4)})`;
    default:
      return (position as Position).type;
  }
}

export { formatPosition };

/**
 * Extract orientation from any position type.
 * WorldPosition stores h/p/r directly; others use an orientation sub-object.
 */
function getOrientationFromPosition(position: Position): Orientation | undefined {
  if (position.type === 'worldPosition') {
    const wp = position as WorldPosition;
    if (wp.h != null || wp.p != null || wp.r != null) {
      return { h: wp.h, p: wp.p, r: wp.r };
    }
    return undefined;
  }
  return (position as { orientation?: Orientation }).orientation;
}

/**
 * Check if orientation is "manual" (has any value set).
 */
function hasManualOrientation(position: Position): boolean {
  const ori = getOrientationFromPosition(position);
  if (!ori) return false;
  return ori.type != null || ori.h != null || ori.p != null || ori.r != null;
}

export function TrajectoryVertexListItem({
  index,
  vertex,
  isSelected,
  onSelect,
  onDelete,
  onTimeChange,
  expanded = false,
  onOrientationChange,
  elementId,
  isLocked = false,
  lockedLabel,
}: TrajectoryVertexListItemProps) {
  const orientationMode = hasManualOrientation(vertex.position) ? 'manual' : 'auto';
  const currentOrientation = getOrientationFromPosition(vertex.position);

  const handleModeChange = (mode: 'auto' | 'manual') => {
    if (!onOrientationChange) return;
    if (mode === 'auto') {
      onOrientationChange(undefined);
    } else {
      // Switch to manual with empty orientation (user fills in values)
      onOrientationChange(currentOrientation ?? { type: 'relative', h: 0 });
    }
  };

  return (
    <div
      className={`rounded-none border transition-colors ${
        isSelected
          ? 'border-[var(--color-glass-edge-active)] bg-[var(--color-accent-dim)]'
          : 'border-[var(--color-glass-edge)] hover:border-[var(--color-glass-edge-mid)] hover:bg-[var(--color-glass-hover)]'
      }`}
    >
      {/* Compact row */}
      <div
        className="flex items-center gap-1.5 px-2 py-1 cursor-pointer"
        onClick={onSelect}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect();
          }
        }}
      >
        {/* Expand chevron */}
        {onOrientationChange && (
          <span className="shrink-0 text-muted-foreground">
            {expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </span>
        )}

        {/* Index badge */}
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-none bg-muted text-[10px] font-semibold text-muted-foreground">
          #{index + 1}
        </span>

        {/* Position summary or locked label */}
        {isLocked ? (
          <span className="flex items-center gap-1 flex-1 truncate text-xs text-muted-foreground italic">
            <Lock className="h-3 w-3" />
            {lockedLabel ?? 'Starts at entity'}
          </span>
        ) : (
          <span className="flex-1 truncate text-xs text-foreground">
            {formatPosition(vertex.position)}
          </span>
        )}

        {/* Time input */}
        <ParameterAwareInput
          value={vertex.time ?? ''}
          placeholder="--"
          onValueChange={(v) => {
            if (v === '') {
              onTimeChange(undefined);
            } else {
              const parsed = parseFloat(v);
              if (!isNaN(parsed)) onTimeChange(parsed);
            }
          }}
          acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
          onClick={(e) => e.stopPropagation()}
          className="h-6 w-[56px] shrink-0 text-[10px] text-center px-1"
          title="Time (s)"
        />

        {/* Delete button */}
        {!isLocked && (
          <button
            type="button"
            className="shrink-0 p-0.5 text-muted-foreground hover:text-destructive transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete vertex"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Expanded orientation section */}
      {expanded && onOrientationChange && (
        <div
          className="px-2 pb-2 pt-1 border-t border-[var(--color-glass-edge)] space-y-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <SegmentedControl
            value={orientationMode}
            options={['auto', 'manual'] as const}
            onValueChange={handleModeChange}
            labels={{ auto: 'Auto', manual: 'Manual' }}
          />

          {orientationMode === 'manual' && (
            <OrientationFields
              orientation={currentOrientation}
              onChange={onOrientationChange}
              elementId={elementId}
            />
          )}
        </div>
      )}
    </div>
  );
}
