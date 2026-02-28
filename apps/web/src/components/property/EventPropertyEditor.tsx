import type { ScenarioEvent } from '@osce/shared';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { EnumSelect } from './EnumSelect';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';
import { EVENT_PRIORITIES } from '../../constants/osc-enum-values';

interface EventPropertyEditorProps {
  event: ScenarioEvent;
}

export function EventPropertyEditor({ event }: EventPropertyEditorProps) {
  const storeApi = useScenarioStoreApi();

  const handlePriorityChange = (value: string) => {
    storeApi.getState().updateEvent(event.id, {
      priority: value as ScenarioEvent['priority'],
    });
  };

  return (
    <div className="space-y-4">
      <div className="pb-2 border-b">
        <p className="text-sm font-medium">{event.name}</p>
        <p className="text-xs text-muted-foreground">
          {event.actions.length} action{event.actions.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid gap-2">
        <Label className="text-xs">Name</Label>
        <Input value={event.name} readOnly className="h-8 text-sm bg-muted" />
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

      <div className="grid gap-2">
        <Label className="text-xs">Actions</Label>
        <Input
          value={String(event.actions.length)}
          readOnly
          className="h-8 text-sm bg-muted"
        />
      </div>
    </div>
  );
}
