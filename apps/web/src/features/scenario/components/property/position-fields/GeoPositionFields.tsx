import type { Position, GeoPosition } from '@osce/shared';
import { NumField, omitKey, parseNum } from './primitives';

export function GeoPositionFields({
  position,
  onChange,
  elementId,
  prefix,
}: {
  position: GeoPosition;
  onChange: (p: Position) => void;
  elementId?: string;
  prefix?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <NumField
        label="Latitude"
        value={position.latitude}
        onChange={(v) => {
          const n = parseNum(v);
          if (n !== undefined) onChange({ ...position, latitude: n });
        }}
        elementId={elementId}
        fieldName={prefix ? `${prefix}.latitude` : undefined}
      />
      <NumField
        label="Longitude"
        value={position.longitude}
        onChange={(v) => {
          const n = parseNum(v);
          if (n !== undefined) onChange({ ...position, longitude: n });
        }}
        elementId={elementId}
        fieldName={prefix ? `${prefix}.longitude` : undefined}
      />
      <NumField
        label="Altitude"
        value={position.altitude}
        onChange={(v) => {
          if (v === '') {
            onChange(omitKey(position, 'altitude') as GeoPosition);
            return;
          }
          const n = parseNum(v);
          if (n !== undefined) onChange({ ...position, altitude: n });
        }}
        optional
        elementId={elementId}
        fieldName={prefix ? `${prefix}.altitude` : undefined}
      />
    </div>
  );
}
