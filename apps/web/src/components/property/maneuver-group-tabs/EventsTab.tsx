import type { ScenarioEvent, EventPriority } from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { EnumSelect } from '../EnumSelect';
import { useScenarioStore, useScenarioStoreApi } from '../../../stores/use-scenario-store';
import { useEditorStore } from '../../../stores/editor-store';
import { EVENT_PRIORITIES } from '../../../constants/osc-enum-values';
import { getActionSummary, getActionTypeLabel } from '../../scene-composer/action-summary';

interface EventsTabProps {
  events: ScenarioEvent[];
}

export function EventsTab({ events }: EventsTabProps) {
  const bindings = useScenarioStore((s) => s.document._editor.parameterBindings);
  const storeApi = useScenarioStoreApi();

  const handleSelectEvent = (eventId: string) => {
    useEditorStore.getState().setSelection({ selectedElementIds: [eventId] });
  };

  if (events.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic p-2">
        No events in this behavior group
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-2">
      {events.map((event) => {
        const firstAction = event.actions[0];
        return (
          <div
            key={event.id}
            className="space-y-2 pb-3 border-b border-[var(--color-glass-edge)]"
          >
            {/* Event name (clickable to navigate) */}
            <button
              onClick={() => handleSelectEvent(event.id)}
              className="w-full text-left text-xs font-medium hover:text-[var(--color-accent-vivid)] transition-colors truncate"
              title="Click to edit event details"
            >
              {event.name}
            </button>

            {/* Action summary (read-only) */}
            {firstAction && (
              <p className="text-[10px] text-muted-foreground truncate px-1">
                {getActionTypeLabel(firstAction)}: {getActionSummary(firstAction, bindings)}
              </p>
            )}

            {/* Priority */}
            <div className="grid gap-1">
              <Label className="text-[10px]">Priority</Label>
              <EnumSelect
                value={event.priority}
                options={EVENT_PRIORITIES as unknown as readonly string[]}
                onValueChange={(v) =>
                  storeApi.getState().updateEvent(event.id, {
                    priority: v as EventPriority,
                  })
                }
                className="h-7 text-xs"
              />
            </div>

            {/* Max Execution Count */}
            <div className="grid gap-1">
              <Label className="text-[10px]">Max Execution Count</Label>
              <Input
                type="number"
                min={1}
                value={event.maximumExecutionCount ?? ''}
                placeholder="unlimited"
                onChange={(e) =>
                  storeApi.getState().updateEvent(event.id, {
                    maximumExecutionCount: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                className="h-7 text-xs"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
