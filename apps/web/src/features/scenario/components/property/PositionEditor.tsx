import { useEffect, useId, useRef } from 'react';
import { Crosshair } from 'lucide-react';
import type { Position } from '@osce/shared';
import { Label } from '../../../../components/ui/label';
import { EnumSelect } from '../../../../components/form/EnumSelect';
import {
  POSITION_TYPE_OPTIONS,
  POSITION_TYPE_LABELS,
  createDefaultPosition,
} from '../../constants/position-defaults';
import { useEditorStore } from '../../../../stores/editor-store';
import { WorldPositionFields } from './position-fields/WorldPositionFields';
import { LanePositionFields } from './position-fields/LanePositionFields';
import { RelativeLanePositionFields } from './position-fields/RelativeLanePositionFields';
import { RoadPositionFields } from './position-fields/RoadPositionFields';
import { RelativeRoadPositionFields } from './position-fields/RelativeRoadPositionFields';
import { RelativeObjectPositionFields } from './position-fields/RelativeObjectPositionFields';
import { RelativeWorldPositionFields } from './position-fields/RelativeWorldPositionFields';
import { GeoPositionFields } from './position-fields/GeoPositionFields';

// Re-exported for backward compatibility: TrajectoryVertexListItem.tsx imports
// OrientationFields from this module's public surface.
export { OrientationFields } from './position-fields/primitives';

interface PositionEditorProps {
  position: Position;
  onChange: (position: Position) => void;
  /** Element ID for parameter binding support */
  elementId?: string;
  /** Field path prefix for parameter binding (e.g., "action.position") */
  fieldPathPrefix?: string;
}

export function PositionEditor({ position, onChange, elementId, fieldPathPrefix }: PositionEditorProps) {
  const pickRequestId = useId();
  const positionPickRequest = useEditorStore((s) => s.positionPickRequest);
  const pickedPosition = useEditorStore((s) => s.pickedPosition);
  const isMyPickActive = positionPickRequest?.requestId === pickRequestId;

  // Resolve picked position when it arrives
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => {
    if (!pickedPosition || pickedPosition.requestId !== pickRequestId) return;

    const targetType = positionPickRequest?.targetType;
    // Build position based on target type stored in the request
    // (request is cleared by now, so read from pickedPosition's associated type)
    if (targetType === 'lanePosition' || position.type === 'lanePosition') {
      onChangeRef.current({
        type: 'lanePosition',
        roadId: pickedPosition.roadId,
        laneId: String(pickedPosition.laneId),
        s: Math.round(pickedPosition.s * 100) / 100,
        offset: Math.abs(pickedPosition.offset) > 0.01
          ? Math.round(pickedPosition.offset * 100) / 100
          : undefined,
        orientation: { h: 0 },
      });
    } else {
      onChangeRef.current({
        type: 'worldPosition',
        x: Math.round(pickedPosition.worldX * 100) / 100,
        y: Math.round(pickedPosition.worldY * 100) / 100,
        z: Math.abs(pickedPosition.worldZ) > 0.01
          ? Math.round(pickedPosition.worldZ * 100) / 100
          : undefined,
        h: Math.round(pickedPosition.heading * 1000) / 1000,
      });
    }
    // Clear picked result
    useEditorStore.getState().cancelPositionPick();
  }, [pickedPosition, pickRequestId, positionPickRequest?.targetType, position.type]);

  const canPick = position.type === 'worldPosition' || position.type === 'lanePosition';

  const handlePickClick = () => {
    if (isMyPickActive) {
      useEditorStore.getState().cancelPositionPick();
    } else {
      useEditorStore.getState().requestPositionPick({
        targetType: position.type === 'lanePosition' ? 'lanePosition' : 'worldPosition',
        requestId: pickRequestId,
      });
    }
  };

  const handleTypeChange = (newType: string) => {
    if (newType === position.type) return;
    onChange(createDefaultPosition(newType as Position['type']));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Position</p>
        {canPick && (
          <button
            type="button"
            onClick={handlePickClick}
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-none border transition-colors ${
              isMyPickActive
                ? 'bg-[var(--color-accent-1)] text-white border-[var(--color-accent-1)]'
                : 'bg-[var(--color-glass-1)] text-[var(--color-text-secondary)] border-[var(--color-glass-edge)] hover:bg-[var(--color-glass-hover)]'
            }`}
            title={isMyPickActive ? 'Cancel pick mode' : 'Pick position from 3D viewer'}
          >
            <Crosshair size={12} />
            {isMyPickActive ? 'Cancel' : 'Pick'}
          </button>
        )}
      </div>

      <div className="grid gap-1">
        <Label className="text-xs">Type</Label>
        <EnumSelect
          value={position.type}
          options={POSITION_TYPE_OPTIONS}
          onValueChange={handleTypeChange}
          className="h-8 text-sm"
        />
        <p className="text-[10px] text-muted-foreground">
          {POSITION_TYPE_LABELS[position.type]}
        </p>
      </div>

      <PositionFields position={position} onChange={onChange} elementId={elementId} prefix={fieldPathPrefix} />
    </div>
  );
}

interface PositionFieldsProps {
  position: Position;
  onChange: (position: Position) => void;
  elementId?: string;
  prefix?: string;
}

function PositionFields({ position, onChange, elementId, prefix }: PositionFieldsProps) {
  switch (position.type) {
    case 'worldPosition':
      return <WorldPositionFields position={position} onChange={onChange} elementId={elementId} prefix={prefix} />;
    case 'lanePosition':
      return <LanePositionFields position={position} onChange={onChange} elementId={elementId} prefix={prefix} />;
    case 'relativeLanePosition':
      return <RelativeLanePositionFields position={position} onChange={onChange} elementId={elementId} prefix={prefix} />;
    case 'roadPosition':
      return <RoadPositionFields position={position} onChange={onChange} elementId={elementId} prefix={prefix} />;
    case 'relativeRoadPosition':
      return <RelativeRoadPositionFields position={position} onChange={onChange} elementId={elementId} prefix={prefix} />;
    case 'relativeObjectPosition':
      return <RelativeObjectPositionFields position={position} onChange={onChange} elementId={elementId} prefix={prefix} />;
    case 'relativeWorldPosition':
      return <RelativeWorldPositionFields position={position} onChange={onChange} elementId={elementId} prefix={prefix} />;
    case 'geoPosition':
      return <GeoPositionFields position={position} onChange={onChange} elementId={elementId} prefix={prefix} />;
    case 'routePosition':
      return (
        <p className="text-xs text-muted-foreground italic">
          Route position editing is not yet supported.
        </p>
      );
  }
}

