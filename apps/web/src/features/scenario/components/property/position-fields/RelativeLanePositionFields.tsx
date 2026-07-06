import type { Position, RelativeLanePosition } from '@osce/shared';
import { TextField, NumField, OrientationFields, omitKey, applyOrientation, parseNum } from './primitives';

export function RelativeLanePositionFields({
  position,
  onChange,
  elementId,
  prefix,
}: {
  position: RelativeLanePosition;
  onChange: (p: Position) => void;
  elementId?: string;
  prefix?: string;
}) {
  const updateOptionalNum = (field: 'ds' | 'dsLane' | 'offset', value: string) => {
    if (value === '') {
      onChange(omitKey(position, field) as RelativeLanePosition);
      return;
    }
    const n = parseNum(value);
    if (n !== undefined) onChange({ ...position, [field]: n });
  };

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
          label="dLane"
          value={position.dLane}
          onChange={(v) => {
            const n = parseNum(v);
            if (n !== undefined) onChange({ ...position, dLane: n });
          }}
          elementId={elementId}
          fieldName={prefix ? `${prefix}.dLane` : undefined}
        />
        <NumField label="ds" value={position.ds} onChange={(v) => updateOptionalNum('ds', v)} optional elementId={elementId} fieldName={prefix ? `${prefix}.ds` : undefined} />
        <NumField label="dsLane" value={position.dsLane} onChange={(v) => updateOptionalNum('dsLane', v)} optional elementId={elementId} fieldName={prefix ? `${prefix}.dsLane` : undefined} />
        <NumField label="Offset" value={position.offset} onChange={(v) => updateOptionalNum('offset', v)} optional elementId={elementId} fieldName={prefix ? `${prefix}.offset` : undefined} />
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
