import { useMemo } from 'react';
import type { ManeuverGroup, Act } from '@osce/shared';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { useScenarioStore } from '../../stores/use-scenario-store';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';
import { BasicTab } from './maneuver-group-tabs/BasicTab';
import { TriggersTab } from './maneuver-group-tabs/TriggersTab';
import { EventsTab } from './maneuver-group-tabs/EventsTab';

interface ManeuverGroupPropertyEditorProps {
  group: ManeuverGroup;
}

export function ManeuverGroupPropertyEditor({ group }: ManeuverGroupPropertyEditorProps) {
  const storeApi = useScenarioStoreApi();

  // Find parent Act ID once (stable unless group moves between acts)
  const actId = useMemo(() => {
    const result = storeApi.getState().getParentOf(group.id);
    if (result) return (result.parent as Act).id;
    return null;
  }, [storeApi, group.id]);

  // Subscribe to the Act by ID so trigger edits cause re-renders
  const parentAct = useScenarioStore((s) =>
    actId ? (s.getElementById(actId) as Act | undefined) : undefined,
  );

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
          <TabsTrigger value="triggers" className="flex-1 text-[11px]">
            Triggers
          </TabsTrigger>
          <TabsTrigger value="events" className="flex-1 text-[11px]">
            Events
          </TabsTrigger>
        </TabsList>
        <TabsContent value="basic">
          <BasicTab group={group} />
        </TabsContent>
        <TabsContent value="triggers">
          <TriggersTab act={parentAct} />
        </TabsContent>
        <TabsContent value="events">
          <EventsTab events={allEvents} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
