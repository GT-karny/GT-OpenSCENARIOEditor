import type { Position, RoadPosition } from '@osce/shared';
import { TextField, NumField, parseNum } from './primitives';

export function RoadPositionFields({
  position,
  onChange,
  elementId,
  prefix,
}: {
  position: RoadPosition;
  onChange: (p: Position) => void;
  elementId?: string;
  prefix?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <TextField
        label="Road ID"
        value={position.roadId}
        onChange={(v) => onChange({ ...position, roadId: v })}
        elementId={elementId}
        fieldName={prefix ? `${prefix}.roadId` : undefined}
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
        label="T"
        value={position.t}
        onChange={(v) => {
          const n = parseNum(v);
          if (n !== undefined) onChange({ ...position, t: n });
        }}
        elementId={elementId}
        fieldName={prefix ? `${prefix}.t` : undefined}
      />
    </div>
  );
}
