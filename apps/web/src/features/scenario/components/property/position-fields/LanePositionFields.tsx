import type { Position, LanePosition } from '@osce/shared';
import { TextField, NumField, OrientationFields, omitKey, applyOrientation, parseNum } from './primitives';

export function LanePositionFields({
  position,
  onChange,
  elementId,
  prefix,
}: {
  position: LanePosition;
  onChange: (p: Position) => void;
  elementId?: string;
  prefix?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <TextField
          label="Road ID"
          value={position.roadId}
          onChange={(v) => onChange({ ...position, roadId: v })}
          elementId={elementId}
          fieldName={prefix ? `${prefix}.roadId` : undefined}
        />
        <TextField
          label="Lane ID"
          value={position.laneId}
          onChange={(v) => onChange({ ...position, laneId: v })}
          elementId={elementId}
          fieldName={prefix ? `${prefix}.laneId` : undefined}
        />
        <NumField
          label="S"
          value={position.s}
          onChange={(v) => {
            const n = parseNum(v);
            if (n !== undefined) onChange({ ...position, s: n });
          }}
          elementId={elementId}
          fieldName={prefix ? `${prefix}.s` : undefined}
        />
        <NumField
          label="Offset"
          value={position.offset}
          onChange={(v) => {
            if (v === '') {
              onChange(omitKey(position, 'offset') as LanePosition);
              return;
            }
            const n = parseNum(v);
            if (n !== undefined) onChange({ ...position, offset: n });
          }}
          optional
          elementId={elementId}
          fieldName={prefix ? `${prefix}.offset` : undefined}
        />
      </div>
      <OrientationFields
        orientation={position.orientation}
        onChange={(o) => onChange(applyOrientation(position, o))}
        elementId={elementId}
        prefix={prefix ? `${prefix}.orientation` : undefined}
      />
    </div>
  );
}
