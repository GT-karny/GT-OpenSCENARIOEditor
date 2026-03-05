import type { ManeuverGroup } from '@osce/shared';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { BasicTab } from './maneuver-group-tabs/BasicTab';
import { EventsTab } from './maneuver-group-tabs/EventsTab';

interface ManeuverGroupPropertyEditorProps {
  group: ManeuverGroup;
}

export function ManeuverGroupPropertyEditor({ group }: ManeuverGroupPropertyEditorProps) {
  // Flatten events from all maneuvers
  const allEvents = group.maneuvers.flatMap((m) => m.events);

  return (
    <div className="flex flex-col gap-1 p-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1">
        Entity Behavior
      </p>
      <Tabs defaultValue="basic">
        <TabsList className="w-full">
          <TabsTrigger value="basic" className="flex-1 text-[11px]">
            Basic
          </TabsTrigger>
          <TabsTrigger value="events" className="flex-1 text-[11px]">
            Events
          </TabsTrigger>
        </TabsList>
        <TabsContent value="basic">
          <BasicTab group={group} />
        </TabsContent>
        <TabsContent value="events">
          <EventsTab events={allEvents} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
