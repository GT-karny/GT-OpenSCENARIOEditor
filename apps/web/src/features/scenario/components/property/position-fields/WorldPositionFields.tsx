import type { Position, WorldPosition } from '@osce/shared';
import { NumField, parseNum, omitKey } from './primitives';

export function WorldPositionFields({
  position,
  onChange,
  elementId,
  prefix,
}: {
  position: WorldPosition;
  onChange: (p: Position) => void;
  elementId?: string;
  prefix?: string;
}) {
  const update = (field: keyof Omit<WorldPosition, 'type'>, value: string) => {
    const n = parseNum(value);
    if (n === undefined) return;
    onChange({ ...position, [field]: n });
  };

  const updateOptional = (field: 'z' | 'h' | 'p' | 'r', value: string) => {
    if (value === '') {
      onChange(omitKey(position, field) as WorldPosition);
      return;
    }
    const n = parseNum(value);
    if (n === undefined) return;
    onChange({ ...position, [field]: n });
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <NumField label="X" value={position.x} onChange={(v) => update('x', v)} elementId={elementId} fieldName={prefix ? `${prefix}.x` : undefined} />
      <NumField label="Y" value={position.y} onChange={(v) => update('y', v)} elementId={elementId} fieldName={prefix ? `${prefix}.y` : undefined} />
      <NumField label="Z" value={position.z} onChange={(v) => updateOptional('z', v)} optional elementId={elementId} fieldName={prefix ? `${prefix}.z` : undefined} />
      <NumField label="H (heading)" value={position.h} onChange={(v) => updateOptional('h', v)} optional elementId={elementId} fieldName={prefix ? `${prefix}.h` : undefined} />
      <NumField label="P (pitch)" value={position.p} onChange={(v) => updateOptional('p', v)} optional elementId={elementId} fieldName={prefix ? `${prefix}.p` : undefined} />
      <NumField label="R (roll)" value={position.r} onChange={(v) => updateOptional('r', v)} optional elementId={elementId} fieldName={prefix ? `${prefix}.r` : undefined} />
    </div>
  );
}
