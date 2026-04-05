import { useState } from 'react';
import {
  Gauge,
  ArrowLeftRight,
  MapPin,
  Navigation,
  Route,
  Gamepad2,
  Eye,
  Lightbulb,
  Link,
  Cloud,
  Users,
  Settings,
  Variable,
  TrafficCone,
  Terminal,
  Activity,
  Trash2,
  GripVertical,
} from 'lucide-react';
import type { ScenarioAction } from '@osce/shared';
import { cn } from '../../lib/utils';
import { useFlashState } from '../../hooks/use-flash-state';
import { useCopyPaste } from '../../hooks/use-clipboard';
import { useScenarioStore } from '../../stores/use-scenario-store';
import { getActionSummary } from './action-summary';
import { ComposerContextMenu } from './ComposerContextMenu';
import type { ComposerMenuPosition } from './ComposerContextMenu';
import { isCustomName } from './name-utils';

interface ActionItemProps {
  action: ScenarioAction;
  selected: boolean;
  running?: boolean;
  onSelect: () => void;
  onRemove: () => void;
  dragHandleProps?: {
    draggable: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
  };
}

export const actionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  speedAction: Gauge,
  speedProfileAction: Activity,
  laneChangeAction: ArrowLeftRight,
  laneOffsetAction: ArrowLeftRight,
  lateralDistanceAction: ArrowLeftRight,
  longitudinalDistanceAction: Navigation,
  teleportAction: MapPin,
  synchronizeAction: Link,
  followTrajectoryAction: Route,
  acquirePositionAction: MapPin,
  routingAction: Route,
  assignControllerAction: Gamepad2,
  activateControllerAction: Gamepad2,
  overrideControllerAction: Gamepad2,
  visibilityAction: Eye,
  appearanceAction: Eye,
  animationAction: Activity,
  lightStateAction: Lightbulb,
  connectTrailerAction: Link,
  disconnectTrailerAction: Link,
  environmentAction: Cloud,
  entityAction: Users,
  parameterAction: Settings,
  variableAction: Variable,
  infrastructureAction: TrafficCone,
  trafficAction: TrafficCone,
  userDefinedAction: Terminal,
};

/**
 * A single action row within an EventRow, shown indented under the trigger.
 */
export function ActionItem({ action, selected, running, onSelect, onRemove, dragHandleProps }: ActionItemProps) {
  const bindings = useScenarioStore((s) => s.document._editor.parameterBindings);
  const Icon = actionIcons[action.action.type] ?? Settings;
  const summary = getActionSummary(action, bindings);
  const flash = useFlashState(running ?? false);
  const [ctxMenu, setCtxMenu] = useState<ComposerMenuPosition | null>(null);
  const { copyElement, duplicateElement } = useCopyPaste();

  return (
    <div
      className={cn(
        'group/action flex items-center gap-2 pl-14 pr-2 py-1 cursor-pointer transition-colors',
        'border border-transparent',
        selected
          ? 'bg-[var(--color-accent-1)]/10 border-[var(--color-accent-1)]/30'
          : flash === 'running'
            ? 'bg-emerald-400/8 border-emerald-400/25'
            : flash === 'fading'
              ? 'sim-flash-fade'
              : 'hover:bg-[var(--color-glass-2)]',
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setCtxMenu({ x: e.clientX, y: e.clientY });
      }}

      {...dragHandleProps}
    >
      <GripVertical className="h-3 w-3 shrink-0 text-[var(--color-text-muted)] opacity-0 group-hover/action:opacity-40 cursor-grab" />
      <Icon className={cn('h-3 w-3 shrink-0', flash !== 'idle' ? 'text-emerald-400' : 'text-[var(--color-accent-1)]')} />
      <span className="text-[11px] text-[var(--color-text-primary)] truncate flex-1">
        {isCustomName(action.name, 'action') && (
          <span className="font-semibold text-[var(--color-accent-1)]">{action.name}: </span>
        )}
        {summary}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="shrink-0 p-0.5 opacity-0 group-hover/action:opacity-100 text-[var(--color-text-muted)] hover:text-destructive transition-all"
        title="Remove action"
      >
        <Trash2 className="h-3 w-3" />
      </button>

      {/* Context menu */}
      {ctxMenu && (
        <ComposerContextMenu
          position={ctxMenu}
          onDuplicate={() => duplicateElement(action.id)}
          onCopy={() => copyElement(action.id)}
          onDelete={onRemove}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </div>
  );
}
