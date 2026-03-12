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
} from 'lucide-react';
import type { ScenarioAction } from '@osce/shared';
import { cn } from '../../lib/utils';
import { getActionSummary } from './action-summary';

interface ActionItemProps {
  action: ScenarioAction;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
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
export function ActionItem({ action, selected, onSelect, onRemove }: ActionItemProps) {
  const Icon = actionIcons[action.action.type] ?? Settings;
  const summary = getActionSummary(action);

  return (
    <div
      className={cn(
        'group/action flex items-center gap-2 pl-14 pr-2 py-1 cursor-pointer transition-colors',
        'border border-transparent',
        selected
          ? 'bg-[var(--color-accent-1)]/10 border-[var(--color-accent-1)]/30'
          : 'hover:bg-[var(--color-glass-2)]',
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <Icon className="h-3 w-3 shrink-0 text-[var(--color-accent-1)]" />
      <span className="text-[11px] text-[var(--color-text-primary)] truncate flex-1">
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
    </div>
  );
}
