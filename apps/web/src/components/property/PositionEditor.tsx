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
  Orientation,
} from '@osce/shared';
import { Label } from '../ui/label';
import { ParameterAwareInput } from './ParameterAwareInput';
import { EnumSelect } from './EnumSelect';
import {
  POSITION_TYPE_OPTIONS,
  POSITION_TYPE_LABELS,
  createDefaultPosition,
} from '../../constants/position-defaults';

interface PositionEditorProps {
  position: Position;
  onChange: (position: Position) => void;
  /** Element ID for parameter binding support */
  elementId?: string;
  /** Field path prefix for parameter binding (e.g., "action.position") */
  fieldPathPrefix?: string;
}

export function PositionEditor({ position, onChange, elementId, fieldPathPrefix }: PositionEditorProps) {
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

function parseNum(value: string): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function omitKey<T>(obj: T, key: string): T {
  const result = { ...obj } as Record<string, unknown>;
  delete result[key];
  return result as T;
}

function applyOrientation<T extends { orientation?: Orientation }>(pos: T, o: Orientation | undefined): T {
  if (o === undefined) {
    const { orientation: _, ...rest } = pos as T & { orientation?: Orientation };
    return rest as T;
  }
  return { ...pos, orientation: o };
}

// --- WorldPosition ---

function WorldPositionFields({
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

// --- LanePosition ---

function LanePositionFields({
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

// --- RelativeLanePosition ---

function RelativeLanePositionFields({
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

// --- RoadPosition ---

function RoadPositionFields({
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

// --- RelativeRoadPosition ---

function RelativeRoadPositionFields({
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

// --- RelativeObjectPosition ---

function RelativeObjectPositionFields({
  position,
  onChange,
  elementId,
  prefix,
}: {
  position: RelativeObjectPosition;
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
              onChange(omitKey(position, 'dz') as RelativeObjectPosition);
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

// --- RelativeWorldPosition ---

function RelativeWorldPositionFields({
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

// --- GeoPosition ---

function GeoPositionFields({
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

// --- Reusable field primitives ---

function NumField({
  label,
  value,
  onChange,
  optional,
  elementId,
  fieldName,
}: {
  label: string;
  value: number | undefined;
  onChange: (value: string) => void;
  optional?: boolean;
  elementId?: string;
  fieldName?: string;
}) {
  return (
    <div className="grid gap-1">
      <Label className="text-xs">
        {label}
        {optional && <span className="text-muted-foreground ml-1">?</span>}
      </Label>
      <ParameterAwareInput
        elementId={elementId}
        fieldName={fieldName}
        value={value ?? ''}
        onValueChange={onChange}
        acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
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
  elementId,
  fieldName,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  elementId?: string;
  fieldName?: string;
}) {
  return (
    <div className="grid gap-1">
      <Label className="text-xs">{label}</Label>
      <ParameterAwareInput
        elementId={elementId}
        fieldName={fieldName}
        value={value}
        onValueChange={onChange}
        acceptedTypes={['string']}
        className="h-8 text-sm"
      />
    </div>
  );
}

// --- OrientationFields ---

function isOrientationEmpty(ori: Partial<Orientation>): boolean {
  return ori.type === undefined && ori.h === undefined && ori.p === undefined && ori.r === undefined;
}

function OrientationFields({
  orientation,
  onChange,
  elementId,
  prefix,
}: {
  orientation: Orientation | undefined;
  onChange: (o: Orientation | undefined) => void;
  elementId?: string;
  prefix?: string;
}) {
  const ori = orientation ?? {};

  const update = (updates: Partial<Orientation>) => {
    const next = { ...ori, ...updates };
    onChange(isOrientationEmpty(next) ? undefined : next);
  };

  const clearKey = (key: keyof Orientation) => {
    const next = { ...ori };
    delete next[key];
    onChange(isOrientationEmpty(next) ? undefined : next);
  };

  const handleOriValue = (key: 'h' | 'p' | 'r', value: string) => {
    if (value === '') {
      clearKey(key);
    } else {
      const n = parseFloat(value);
      if (Number.isFinite(n)) update({ [key]: n });
    }
  };

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">Orientation</p>
      <div className="grid gap-1">
        <Label className="text-xs">
          Type <span className="text-muted-foreground">?</span>
        </Label>
        <EnumSelect
          value={ori.type ?? ''}
          options={['', 'relative', 'absolute']}
          onValueChange={(v) =>
            v
              ? update({ type: v as 'relative' | 'absolute' })
              : clearKey('type')
          }
          className="h-8 text-sm"
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="grid gap-1">
          <Label className="text-xs">
            H <span className="text-muted-foreground">?</span>
          </Label>
          <ParameterAwareInput
            elementId={elementId}
            fieldName={prefix ? `${prefix}.h` : undefined}
            value={ori.h ?? ''}
            onValueChange={(v) => handleOriValue('h', v)}
            acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
            placeholder="—"
            step="any"
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">
            P <span className="text-muted-foreground">?</span>
          </Label>
          <ParameterAwareInput
            elementId={elementId}
            fieldName={prefix ? `${prefix}.p` : undefined}
            value={ori.p ?? ''}
            onValueChange={(v) => handleOriValue('p', v)}
            acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
            placeholder="—"
            step="any"
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">
            R <span className="text-muted-foreground">?</span>
          </Label>
          <ParameterAwareInput
            elementId={elementId}
            fieldName={prefix ? `${prefix}.r` : undefined}
            value={ori.r ?? ''}
            onValueChange={(v) => handleOriValue('r', v)}
            acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
            placeholder="—"
            step="any"
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
