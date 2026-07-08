import type { Position, RelativeRoadPosition } from '@osce/shared';
import { TextField, NumField, parseNum } from './primitives';

export function RelativeRoadPositionFields({
  position,
  onChange,
  elementId,
  prefix,
}: {
  position: RelativeRoadPosition;
  onChange: (p: Position) => void;
  elementId?: string;
  prefix?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <TextField
        label="Entity Ref"
        value={position.entityRef}
        onChange={(v) => onChange({ ...position, entityRef: v })}
        elementId={elementId}
        fieldName={prefix ? `${prefix}.entityRef` : undefined}
      />
      <NumField
        label="ds"
        value={position.ds}
        onChange={(v) => {
          const n = parseNum(v);
          if (n !== undefined) onChange({ ...position, ds: n });
        }}
        elementId={elementId}
        fieldName={prefix ? `${prefix}.ds` : undefined}
      />
      <NumField
        label="dt"
        value={position.dt}
        onChange={(v) => {
          const n = parseNum(v);
          if (n !== undefined) onChange({ ...position, dt: n });
        }}
        elementId={elementId}
        fieldName={prefix ? `${prefix}.dt` : undefined}
      />
    </div>
  );
}
