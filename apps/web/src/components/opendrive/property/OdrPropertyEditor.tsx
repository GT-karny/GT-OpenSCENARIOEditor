import type {
  OpenDriveDocument,
  OdrRoad,
  OdrLane,
  OdrSignal,
  OdrJunction,
  OdrHeader,
} from '@osce/shared';
import { OdrHeaderPropertyEditor } from './OdrHeaderPropertyEditor';
import { OdrRoadPropertyEditor } from './OdrRoadPropertyEditor';
import { OdrGeometryPropertyEditor } from './OdrGeometryPropertyEditor';
import { OdrLanePropertyEditor } from './OdrLanePropertyEditor';
import { OdrSignalPropertyEditor } from './OdrSignalPropertyEditor';
import { OdrJunctionPropertyEditor } from './OdrJunctionPropertyEditor';

interface OdrPropertyEditorProps {
  selectedRoadId: string | null;
  selectedLaneId: number | null;
  selectedSignalId: string | null;
  selectedJunctionId: string | null;
  selectedGeometryIndex: number | null;
  document: OpenDriveDocument;
  onUpdateRoad: (roadId: string, updates: Partial<OdrRoad>) => void;
  onUpdateLane: (
    roadId: string,
    sectionIdx: number,
    laneId: number,
    updates: Partial<OdrLane>,
  ) => void;
  onUpdateSignal: (roadId: string, signalId: string, updates: Partial<OdrSignal>) => void;
  onUpdateJunction: (junctionId: string, updates: Partial<OdrJunction>) => void;
  onUpdateHeader: (updates: Partial<OdrHeader>) => void;
}

export function OdrPropertyEditor({
  selectedRoadId,
  selectedLaneId,
  selectedSignalId,
  selectedJunctionId,
  selectedGeometryIndex,
  document,
  onUpdateRoad,
  onUpdateLane,
  onUpdateSignal,
  onUpdateJunction,
  onUpdateHeader,
}: OdrPropertyEditorProps) {
  const road = selectedRoadId
    ? document.roads.find((r) => r.id === selectedRoadId)
    : undefined;

  // Junction editor
  if (selectedJunctionId) {
    const junction = document.junctions.find((j) => j.id === selectedJunctionId);
    if (junction) {
      return (
        <div className="panel-scroll overflow-y-auto bg-[var(--color-glass-1)] p-3">
          <OdrJunctionPropertyEditor junction={junction} onUpdate={onUpdateJunction} />
        </div>
      );
    }
  }

  // Signal editor (requires a road context)
  if (selectedSignalId && road) {
    const signal = road.signals.find((s) => s.id === selectedSignalId);
    if (signal) {
      return (
        <div className="panel-scroll overflow-y-auto bg-[var(--color-glass-1)] p-3">
          <OdrSignalPropertyEditor
            signal={signal}
            roadId={road.id}
            onUpdate={onUpdateSignal}
          />
        </div>
      );
    }
  }

  // Lane editor (requires a road context)
  if (selectedLaneId !== null && road) {
    const result = findLaneInRoad(road, selectedLaneId);
    if (result) {
      return (
        <div className="panel-scroll overflow-y-auto bg-[var(--color-glass-1)] p-3">
          <OdrLanePropertyEditor
            lane={result.lane}
            roadId={road.id}
            sectionIdx={result.sectionIdx}
            onUpdate={onUpdateLane}
          />
        </div>
      );
    }
  }

  // Geometry editor (requires a road context)
  if (selectedGeometryIndex !== null && road) {
    const geometry = road.planView[selectedGeometryIndex];
    if (geometry) {
      return (
        <div className="panel-scroll overflow-y-auto bg-[var(--color-glass-1)] p-3">
          <OdrGeometryPropertyEditor
            geometry={geometry}
            index={selectedGeometryIndex}
            onUpdate={(updates) => {
              const updatedPlanView = [...road.planView];
              updatedPlanView[selectedGeometryIndex] = { ...geometry, ...updates };
              onUpdateRoad(road.id, { planView: updatedPlanView });
            }}
          />
        </div>
      );
    }
  }

  // Road editor
  if (road) {
    return (
      <div className="panel-scroll overflow-y-auto bg-[var(--color-glass-1)] p-3">
        <OdrRoadPropertyEditor road={road} onUpdate={onUpdateRoad} />
      </div>
    );
  }

  // Default: show header editor
  return (
    <div className="panel-scroll overflow-y-auto bg-[var(--color-glass-1)] p-3">
      <OdrHeaderPropertyEditor header={document.header} onUpdate={onUpdateHeader} />
    </div>
  );
}

/**
 * Find a lane by id across all lane sections in a road.
 * Returns the lane and its section index.
 */
function findLaneInRoad(
  road: OdrRoad,
  laneId: number,
): { lane: OdrLane; sectionIdx: number } | undefined {
  for (let i = 0; i < road.lanes.length; i++) {
    const section = road.lanes[i];
    const allLanes = [...section.leftLanes, section.centerLane, ...section.rightLanes];
    const lane = allLanes.find((l) => l.id === laneId);
    if (lane) {
      return { lane, sectionIdx: i };
    }
  }
  return undefined;
}
