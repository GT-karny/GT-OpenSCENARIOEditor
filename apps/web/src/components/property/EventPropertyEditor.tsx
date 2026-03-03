import type { ScenarioEvent } from '@osce/shared';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { EnumSelect } from './EnumSelect';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';
import { EVENT_PRIORITIES } from '../../constants/osc-enum-values';
import { ActionPropertyEditor } from './ActionPropertyEditor';
import { ConditionPropertyEditor } from './ConditionPropertyEditor';

interface EventPropertyEditorProps {
  event: ScenarioEvent;
}

/**
 * Unified Event + Action + Trigger property editor.
 * Shown when selecting an ActionRow in the Composer view.
 */
export function EventPropertyEditor({ event }: EventPropertyEditorProps) {
  const storeApi = useScenarioStoreApi();

  const handleNameChange = (name: string) => {
    storeApi.getState().updateEvent(event.id, { name });
  };

  const handlePriorityChange = (value: string) => {
    storeApi.getState().updateEvent(event.id, {
      priority: value as ScenarioEvent['priority'],
    });
  };

  const firstAction = event.actions[0] ?? null;

  return (
    <div className="flex flex-col gap-5 p-1">
      {/* Section 1: Event properties */}
      <section className="space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Event
        </p>

        <div className="grid gap-2">
          <Label className="text-xs">Name</Label>
          <Input
            value={event.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        <div className="grid gap-2">
          <Label className="text-xs">Priority</Label>
          <EnumSelect
            value={event.priority}
            options={EVENT_PRIORITIES}
            onValueChange={handlePriorityChange}
            className="h-8 text-sm"
          />
        </div>
      </section>

      {/* Section 2: Action details */}
      <section className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Action{event.actions.length > 1 ? ` (1 of ${event.actions.length})` : ''}
        </p>
        {firstAction ? (
          <ActionPropertyEditor action={firstAction} />
        ) : (
          <p className="text-xs text-muted-foreground italic">No actions defined</p>
        )}
      </section>

      {/* Section 3: Start Trigger */}
      <section className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Start Trigger
        </p>
        <ConditionPropertyEditor trigger={event.startTrigger} />
      </section>
    </div>
  );
}
