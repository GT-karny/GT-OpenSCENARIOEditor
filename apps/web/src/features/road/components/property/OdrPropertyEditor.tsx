import type {
  OpenDriveDocument,
  OdrRoad,
  OdrLane,
  OdrSignal,
  OdrJunction,
  OdrHeader,
  OdrGeometry,
  OdrGeometryUpdate,
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
  /** Active lane section index (from cross-section view or hover) */
  activeSectionIdx?: number;
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
  activeSectionIdx,
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
    const result = findLaneInRoad(road, selectedLaneId, activeSectionIdx);
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
              updatedPlanView[selectedGeometryIndex] = applyGeometryUpdate(geometry, updates);
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
 * Merge a flat geometry patch into an existing segment, rebuilding the correct
 * discriminated-union variant (the patch may switch the type, e.g. via
 * convertGeometryType, or just tweak fields of the current variant).
 */
function applyGeometryUpdate(geometry: OdrGeometry, updates: OdrGeometryUpdate): OdrGeometry {
  const merged: OdrGeometryUpdate = { ...geometry, ...updates };
  const base = {
    s: merged.s ?? geometry.s,
    x: merged.x ?? geometry.x,
    y: merged.y ?? geometry.y,
    hdg: merged.hdg ?? geometry.hdg,
    length: merged.length ?? geometry.length,
  };
  switch (merged.type ?? geometry.type) {
    case 'arc':
      return { ...base, type: 'arc', curvature: merged.curvature ?? 0 };
    case 'spiral':
      return {
        ...base,
        type: 'spiral',
        curvStart: merged.curvStart ?? 0,
        curvEnd: merged.curvEnd ?? 0,
      };
    case 'poly3':
      return {
        ...base,
        type: 'poly3',
        a: merged.a ?? 0,
        b: merged.b ?? 0,
        c: merged.c ?? 0,
        d: merged.d ?? 0,
      };
    case 'paramPoly3':
      return {
        ...base,
        type: 'paramPoly3',
        aU: merged.aU ?? 0,
        bU: merged.bU ?? 0,
        cU: merged.cU ?? 0,
        dU: merged.dU ?? 0,
        aV: merged.aV ?? 0,
        bV: merged.bV ?? 0,
        cV: merged.cV ?? 0,
        dV: merged.dV ?? 0,
        pRange: merged.pRange ?? 'arcLength',
      };
    case 'line':
    default:
      return { ...base, type: 'line' };
  }
}

/**
 * Find a lane by id in a road.
 * If activeSectionIdx is provided, look in that section first.
 * Falls back to scanning all sections if the lane isn't found there.
 */
function findLaneInRoad(
  road: OdrRoad,
  laneId: number,
  activeSectionIdx?: number,
): { lane: OdrLane; sectionIdx: number } | undefined {
  // Prefer the active section
  if (activeSectionIdx !== undefined && activeSectionIdx < road.lanes.length) {
    const section = road.lanes[activeSectionIdx];
    const allLanes = [...section.leftLanes, section.centerLane, ...section.rightLanes];
    const lane = allLanes.find((l) => l.id === laneId);
    if (lane) {
      return { lane, sectionIdx: activeSectionIdx };
    }
  }

  // Fallback: scan all sections
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
