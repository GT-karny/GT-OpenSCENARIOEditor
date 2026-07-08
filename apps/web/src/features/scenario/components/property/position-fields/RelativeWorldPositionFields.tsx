import type { Position, RelativeWorldPosition } from '@osce/shared';
import { TextField, NumField, OrientationFields, omitKey, applyOrientation, parseNum } from './primitives';

export function RelativeWorldPositionFields({
  position,
  onChange,
  elementId,
  prefix,
}: {
  position: RelativeWorldPosition;
  onChange: (p: Position) => void;
  elementId?: string;
  prefix?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <TextField
          label="Entity Ref"
          value={position.entityRef}
          onChange={(v) => onChange({ ...position, entityRef: v })}
          elementId={elementId}
          fieldName={prefix ? `${prefix}.entityRef` : undefined}
        />
        <NumField
          label="dx"
          value={position.dx}
          onChange={(v) => {
            const n = parseNum(v);
            if (n !== undefined) onChange({ ...position, dx: n });
          }}
          elementId={elementId}
          fieldName={prefix ? `${prefix}.dx` : undefined}
        />
        <NumField
          label="dy"
          value={position.dy}
          onChange={(v) => {
            const n = parseNum(v);
            if (n !== undefined) onChange({ ...position, dy: n });
          }}
          elementId={elementId}
          fieldName={prefix ? `${prefix}.dy` : undefined}
        />
        <NumField
          label="dz"
          value={position.dz}
          onChange={(v) => {
            if (v === '') {
              onChange(omitKey(position, 'dz') as RelativeWorldPosition);
              return;
            }
            const n = parseNum(v);
            if (n !== undefined) onChange({ ...position, dz: n });
          }}
          optional
          elementId={elementId}
          fieldName={prefix ? `${prefix}.dz` : undefined}
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
