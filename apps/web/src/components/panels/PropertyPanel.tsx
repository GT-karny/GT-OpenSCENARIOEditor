import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ScrollArea } from '../ui/scroll-area';
import { PropertyEditor } from '../property/PropertyEditor';
import { ScenarioPropertyEditor } from '../property/ScenarioPropertyEditor';
import { SignalPropertyEditor } from '../property/SignalPropertyEditor';
import { SignalControllerPropertyEditor } from '../property/SignalControllerPropertyEditor';
import { useScenarioStore } from '../../stores/use-scenario-store';
import { useEditorStore } from '../../stores/editor-store';

export function PropertyPanel() {
  const selectedIds = useEditorStore(useShallow((s) => s.selection.selectedElementIds));
  const selectedId = selectedIds[0] ?? null;
  const selectedSignalKey = useEditorStore((s) => s.selectedSignalKey);
  const roadNetwork = useEditorStore((s) => s.roadNetwork);
  const showIntersectionTimeline = useEditorStore((s) => s.showIntersectionTimeline);

  const element = useScenarioStore((s) =>
    selectedId ? s.getElementById(selectedId) : null,
  );

  // Resolve signal from selectedSignalKey (roadId:signalId)
  const signalData = useMemo(() => {
    if (!selectedSignalKey || !roadNetwork) return null;
    const colonIdx = selectedSignalKey.indexOf(':');
    if (colonIdx < 0) return null;
    const roadId = selectedSignalKey.substring(0, colonIdx);
    const signalId = selectedSignalKey.substring(colonIdx + 1);
    const road = roadNetwork.roads.find((r) => r.id === roadId);
    if (!road) return null;
    const signal = road.signals.find((s) => s.id === signalId);
    if (!signal) return null;
    return { signal, road, controllers: roadNetwork.controllers ?? [] };
  }, [selectedSignalKey, roadNetwork]);

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Always show controller editor when timeline is open */}
          {showIntersectionTimeline && <SignalControllerPropertyEditor />}

          {/* Context-dependent content below */}
          {signalData ? (
            <SignalPropertyEditor
              signal={signalData.signal}
              road={signalData.road}
              controllers={signalData.controllers}
            />
          ) : element ? (
            <PropertyEditor element={element} elementId={selectedId!} />
          ) : !showIntersectionTimeline ? (
            <ScenarioPropertyEditor />
          ) : null}
        </div>
      </ScrollArea>
    </div>
  );
}
