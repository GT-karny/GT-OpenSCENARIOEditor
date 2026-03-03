import { GripVertical, Trash2, Zap } from 'lucide-react';
import type { ScenarioEvent } from '@osce/shared';
import { cn } from '../../lib/utils';
import { getActionSummary, getActionTypeLabel } from './action-summary';
import { getTriggerSummary } from './trigger-summary';

interface ActionRowProps {
  event: ScenarioEvent;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

/**
 * A single row representing an Event + its first Action in the simplified composer view.
 * Shows the action type/summary and trigger condition as a compact row.
 */
export function ActionRow({ event, selected, onSelect, onRemove }: ActionRowProps) {
  const action = event.actions[0];
  const triggerLabel = getTriggerSummary(event.startTrigger);
  const hasCondition = event.startTrigger.conditionGroups.length > 0 &&
    event.startTrigger.conditionGroups.some((g) => g.conditions.length > 0);

  return (
    <div
      className={cn(
        'group/row flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
        'border border-transparent',
        selected
          ? 'bg-[var(--color-accent-1)]/10 border-[var(--color-accent-1)]/30'
          : 'hover:bg-[var(--color-glass-2)]',
      )}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
    >
      {/* Drag handle placeholder */}
      <GripVertical className="h-3 w-3 shrink-0 text-[var(--color-text-muted)] opacity-0 group-hover/row:opacity-40" />

      {/* Action info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-accent-1)]/15 text-[var(--color-accent-1)] font-medium shrink-0">
            {action ? getActionTypeLabel({ ...action, id: action.id, name: action.name }) : 'No action'}
          </span>
          <span className="text-[11px] text-[var(--color-text-primary)] truncate">
            {action ? getActionSummary(action) : '(empty)'}
          </span>
        </div>

        {/* Trigger condition */}
        {hasCondition && (
          <div className="flex items-center gap-1 mt-0.5 ml-0.5">
            <Zap className="h-2.5 w-2.5 text-[var(--color-accent-vivid)] shrink-0" />
            <span className="text-[10px] font-mono text-[var(--color-accent-vivid)] opacity-70 truncate">
              {triggerLabel}
            </span>
          </div>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="shrink-0 p-0.5 rounded opacity-0 group-hover/row:opacity-100 text-[var(--color-text-muted)] hover:text-destructive transition-all"
        title="Remove action"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
