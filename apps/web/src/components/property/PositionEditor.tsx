import type {
  Position,
  WorldPosition,
  LanePosition,
  RelativeLanePosition,
  RoadPosition,
  RelativeRoadPosition,
  RelativeObjectPosition,
  RelativeWorldPosition,
  GeoPosition,
} from '@osce/shared';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { EnumSelect } from './EnumSelect';
import {
  POSITION_TYPE_OPTIONS,
  POSITION_TYPE_LABELS,
  createDefaultPosition,
} from '../../constants/position-defaults';

interface PositionEditorProps {
  position: Position;
  onChange: (position: Position) => void;
}

export function PositionEditor({ position, onChange }: PositionEditorProps) {
  const handleTypeChange = (newType: string) => {
    if (newType === position.type) return;
    onChange(createDefaultPosition(newType as Position['type']));
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Position</p>

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

      <PositionFields position={position} onChange={onChange} />
    </div>
  );
}

interface PositionFieldsProps {
  position: Position;
  onChange: (position: Position) => void;
}

function PositionFields({ position, onChange }: PositionFieldsProps) {
  switch (position.type) {
    case 'worldPosition':
      return <WorldPositionFields position={position} onChange={onChange} />;
    case 'lanePosition':
      return <LanePositionFields position={position} onChange={onChange} />;
    case 'relativeLanePosition':
      return <RelativeLanePositionFields position={position} onChange={onChange} />;
    case 'roadPosition':
      return <RoadPositionFields position={position} onChange={onChange} />;
    case 'relativeRoadPosition':
      return <RelativeRoadPositionFields position={position} onChange={onChange} />;
    case 'relativeObjectPosition':
      return <RelativeObjectPositionFields position={position} onChange={onChange} />;
    case 'relativeWorldPosition':
      return <RelativeWorldPositionFields position={position} onChange={onChange} />;
    case 'geoPosition':
      return <GeoPositionFields position={position} onChange={onChange} />;
    case 'routePosition':
      return (
        <p className="text-xs text-muted-foreground italic">
          Route position editing is not yet supported.
        </p>
      );
  }
}

function parseNum(value: string): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function omitKey<T>(obj: T, key: string): T {
  const result = { ...obj } as Record<string, unknown>;
  delete result[key];
  return result as T;
}

// --- WorldPosition ---

function WorldPositionFields({
  position,
  onChange,
}: {
  position: WorldPosition;
  onChange: (p: Position) => void;
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
      <NumField label="X" value={position.x} onChange={(v) => update('x', v)} />
      <NumField label="Y" value={position.y} onChange={(v) => update('y', v)} />
      <NumField label="Z" value={position.z} onChange={(v) => updateOptional('z', v)} optional />
      <NumField label="H (heading)" value={position.h} onChange={(v) => updateOptional('h', v)} optional />
      <NumField label="P (pitch)" value={position.p} onChange={(v) => updateOptional('p', v)} optional />
      <NumField label="R (roll)" value={position.r} onChange={(v) => updateOptional('r', v)} optional />
    </div>
  );
}

// --- LanePosition ---

function LanePositionFields({
  position,
  onChange,
}: {
  position: LanePosition;
  onChange: (p: Position) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <TextField
        label="Road ID"
        value={position.roadId}
        onChange={(v) => onChange({ ...position, roadId: v })}
      />
      <TextField
        label="Lane ID"
        value={position.laneId}
        onChange={(v) => onChange({ ...position, laneId: v })}
      />
      <NumField
        label="S"
        value={position.s}
        onChange={(v) => {
          const n = parseNum(v);
          if (n !== undefined) onChange({ ...position, s: n });
        }}
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
      />
    </div>
  );
}

// --- RelativeLanePosition ---

function RelativeLanePositionFields({
  position,
  onChange,
}: {
  position: RelativeLanePosition;
  onChange: (p: Position) => void;
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
    <div className="grid grid-cols-2 gap-2">
      <TextField
        label="Entity Ref"
        value={position.entityRef}
        onChange={(v) => onChange({ ...position, entityRef: v })}
      />
      <NumField
        label="dLane"
        value={position.dLane}
        onChange={(v) => {
          const n = parseNum(v);
          if (n !== undefined) onChange({ ...position, dLane: n });
        }}
      />
      <NumField label="ds" value={position.ds} onChange={(v) => updateOptionalNum('ds', v)} optional />
      <NumField label="dsLane" value={position.dsLane} onChange={(v) => updateOptionalNum('dsLane', v)} optional />
      <NumField label="Offset" value={position.offset} onChange={(v) => updateOptionalNum('offset', v)} optional />
    </div>
  );
}

// --- RoadPosition ---

function RoadPositionFields({
  position,
  onChange,
}: {
  position: RoadPosition;
  onChange: (p: Position) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <TextField
        label="Road ID"
        value={position.roadId}
        onChange={(v) => onChange({ ...position, roadId: v })}
      />
      <NumField
        label="S"
        value={position.s}
        onChange={(v) => {
          const n = parseNum(v);
          if (n !== undefined) onChange({ ...position, s: n });
        }}
      />
      <NumField
        label="T"
        value={position.t}
        onChange={(v) => {
          const n = parseNum(v);
          if (n !== undefined) onChange({ ...position, t: n });
        }}
      />
    </div>
  );
}

// --- RelativeRoadPosition ---

function RelativeRoadPositionFields({
  position,
  onChange,
}: {
  position: RelativeRoadPosition;
  onChange: (p: Position) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <TextField
        label="Entity Ref"
        value={position.entityRef}
        onChange={(v) => onChange({ ...position, entityRef: v })}
      />
      <NumField
        label="ds"
        value={position.ds}
        onChange={(v) => {
          const n = parseNum(v);
          if (n !== undefined) onChange({ ...position, ds: n });
        }}
      />
      <NumField
        label="dt"
        value={position.dt}
        onChange={(v) => {
          const n = parseNum(v);
          if (n !== undefined) onChange({ ...position, dt: n });
        }}
      />
    </div>
  );
}

// --- RelativeObjectPosition ---

function RelativeObjectPositionFields({
  position,
  onChange,
}: {
  position: RelativeObjectPosition;
  onChange: (p: Position) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <TextField
        label="Entity Ref"
        value={position.entityRef}
        onChange={(v) => onChange({ ...position, entityRef: v })}
      />
      <NumField
        label="dx"
        value={position.dx}
        onChange={(v) => {
          const n = parseNum(v);
          if (n !== undefined) onChange({ ...position, dx: n });
        }}
      />
      <NumField
        label="dy"
        value={position.dy}
        onChange={(v) => {
          const n = parseNum(v);
          if (n !== undefined) onChange({ ...position, dy: n });
        }}
      />
      <NumField
        label="dz"
        value={position.dz}
        onChange={(v) => {
          if (v === '') {
            onChange(omitKey(position, 'dz') as RelativeObjectPosition);
            return;
          }
          const n = parseNum(v);
          if (n !== undefined) onChange({ ...position, dz: n });
        }}
        optional
      />
    </div>
  );
}

// --- RelativeWorldPosition ---

function RelativeWorldPositionFields({
  position,
  onChange,
}: {
  position: RelativeWorldPosition;
  onChange: (p: Position) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <TextField
        label="Entity Ref"
        value={position.entityRef}
        onChange={(v) => onChange({ ...position, entityRef: v })}
      />
      <NumField
        label="dx"
        value={position.dx}
        onChange={(v) => {
          const n = parseNum(v);
          if (n !== undefined) onChange({ ...position, dx: n });
        }}
      />
      <NumField
        label="dy"
        value={position.dy}
        onChange={(v) => {
          const n = parseNum(v);
          if (n !== undefined) onChange({ ...position, dy: n });
        }}
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
      />
    </div>
  );
}

// --- GeoPosition ---

function GeoPositionFields({
  position,
  onChange,
}: {
  position: GeoPosition;
  onChange: (p: Position) => void;
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
      />
      <NumField
        label="Longitude"
        value={position.longitude}
        onChange={(v) => {
          const n = parseNum(v);
          if (n !== undefined) onChange({ ...position, longitude: n });
        }}
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
      />
    </div>
  );
}

// --- Reusable field primitives ---

function NumField({
  label,
  value,
  onChange,
  optional,
}: {
  label: string;
  value: number | undefined;
  onChange: (value: string) => void;
  optional?: boolean;
}) {
  return (
    <div className="grid gap-1">
      <Label className="text-xs">
        {label}
        {optional && <span className="text-muted-foreground ml-1">?</span>}
      </Label>
      <Input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={optional ? '—' : '0'}
        className="h-8 text-sm"
        step="any"
      />
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-sm"
      />
    </div>
  );
}
