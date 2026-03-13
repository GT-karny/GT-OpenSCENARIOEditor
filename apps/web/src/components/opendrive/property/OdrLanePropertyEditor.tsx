import { useState } from 'react';
import type { OdrLane, OdrLaneWidth, OdrRoadMark } from '@osce/shared';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Badge } from '../../ui/badge';
import { EnumSelect } from '../../property/EnumSelect';

const LANE_TYPES: readonly string[] = [
  'shoulder',
  'border',
  'driving',
  'stop',
  'none',
  'restricted',
  'parking',
  'median',
  'biking',
  'sidewalk',
  'curb',
  'exit',
  'entry',
  'onRamp',
  'offRamp',
  'connectingRamp',
  'bidirectional',
  'special1',
  'special2',
  'special3',
  'roadWorks',
  'tram',
  'rail',
  'bus',
  'taxi',
  'HOV',
  'mwyEntry',
  'mwyExit',
];

const ROAD_MARK_TYPES: readonly string[] = [
  'none',
  'solid',
  'broken',
  'solid_solid',
  'solid_broken',
  'broken_solid',
  'broken_broken',
  'botts_dots',
  'grass',
  'curb',
  'custom',
  'edge',
];

const ROAD_MARK_COLORS: readonly string[] = [
  'standard',
  'blue',
  'green',
  'red',
  'white',
  'yellow',
  'orange',
  'violet',
];

const ROAD_MARK_WEIGHTS: readonly string[] = ['standard', 'bold'];

const LANE_CHANGE_OPTIONS: readonly string[] = ['none', 'increase', 'decrease', 'both'];

const SPEED_UNITS: readonly string[] = ['m/s', 'km/h', 'mph'];

interface OdrLanePropertyEditorProps {
  lane: OdrLane;
  roadId: string;
  sectionIdx: number;
  onUpdate: (roadId: string, sectionIdx: number, laneId: number, updates: Partial<OdrLane>) => void;
}

export function OdrLanePropertyEditor({
  lane,
  roadId,
  sectionIdx,
  onUpdate,
}: OdrLanePropertyEditorProps) {
  const [showAdvancedWidth, setShowAdvancedWidth] = useState(false);

  const handleUpdateLane = (updates: Partial<OdrLane>) => {
    onUpdate(roadId, sectionIdx, lane.id, updates);
  };

  const firstWidth = lane.width[0] ?? { sOffset: 0, a: 0, b: 0, c: 0, d: 0 };

  return (
    <div className="space-y-4">
      {/* Section: Lane Identity */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
          Lane Properties
        </h3>
        <div className="space-y-2">
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">ID</Label>
            <Input
              value={lane.id}
              readOnly
              className="h-7 text-xs bg-[var(--color-glass-1)] opacity-60"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">Type</Label>
            <EnumSelect
              value={lane.type}
              options={LANE_TYPES}
              onValueChange={(v) => handleUpdateLane({ type: v })}
              className="h-7 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`lane-level-${lane.id}`}
              checked={lane.level ?? false}
              onChange={(e) => handleUpdateLane({ level: e.target.checked })}
              className="rounded-none"
            />
            <Label
              htmlFor={`lane-level-${lane.id}`}
              className="text-[var(--color-text-secondary)] text-xs cursor-pointer"
            >
              Level (keep lane level regardless of superelevation)
            </Label>
          </div>
        </div>
      </div>

      {/* Section: Width */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider">
            Width
          </h3>
          <button
            type="button"
            onClick={() => setShowAdvancedWidth(!showAdvancedWidth)}
            className="text-[10px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            {showAdvancedWidth ? 'Simple' : 'Advanced'}
          </button>
        </div>
        {!showAdvancedWidth ? (
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">
              Constant Width (m)
            </Label>
            <Input
              type="number"
              step="0.1"
              value={firstWidth.a}
              onChange={(e) => {
                const updated: OdrLaneWidth[] = [
                  { ...firstWidth, a: Number(e.target.value), b: 0, c: 0, d: 0 },
                  ...lane.width.slice(1),
                ];
                handleUpdateLane({ width: updated });
              }}
              className="h-7 text-xs"
            />
          </div>
        ) : (
          <div className="space-y-2">
            {lane.width.map((w, idx) => (
              <div key={idx} className="p-2 bg-[var(--color-glass-1)] space-y-2">
                <Badge variant="outline" className="text-[10px] py-0">
                  sOffset={w.sOffset.toFixed(2)}
                </Badge>
                <div className="grid grid-cols-2 gap-2">
                  {(['a', 'b', 'c', 'd'] as const).map((coeff) => (
                    <div key={coeff} className="grid gap-1">
                      <Label className="text-[var(--color-text-secondary)] text-xs">{coeff}</Label>
                      <Input
                        type="number"
                        step="0.001"
                        value={w[coeff]}
                        onChange={(e) => {
                          const updated = [...lane.width];
                          updated[idx] = { ...w, [coeff]: Number(e.target.value) };
                          handleUpdateLane({ width: updated });
                        }}
                        className="h-7 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {lane.width.length === 0 && (
              <p className="text-xs text-[var(--color-text-secondary)] italic">
                No width entries defined
              </p>
            )}
          </div>
        )}
      </div>

      {/* Section: Road Marks */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
          Road Marks
        </h3>
        {lane.roadMarks.length === 0 ? (
          <p className="text-xs text-[var(--color-text-secondary)] italic">
            No road marks defined
          </p>
        ) : (
          <div className="space-y-3">
            {lane.roadMarks.map((mark, idx) => (
              <RoadMarkEditor
                key={idx}
                mark={mark}
                index={idx}
                onChange={(updated) => {
                  const marks = [...lane.roadMarks];
                  marks[idx] = updated;
                  handleUpdateLane({ roadMarks: marks });
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Section: Speed Limits */}
      {lane.speed && lane.speed.length > 0 && (
        <div className="pb-3 border-b border-[var(--color-glass-edge)]">
          <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
            Speed Limits
          </h3>
          <div className="space-y-2">
            {lane.speed.map((sp, idx) => (
              <div key={idx} className="p-2 bg-[var(--color-glass-1)] space-y-2">
                <Badge variant="outline" className="text-[10px] py-0">
                  sOffset={sp.sOffset.toFixed(2)}
                </Badge>
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-1">
                    <Label className="text-[var(--color-text-secondary)] text-xs">Max Speed</Label>
                    <Input
                      type="number"
                      value={sp.max}
                      onChange={(e) => {
                        const updated = [...(lane.speed ?? [])];
                        updated[idx] = { ...sp, max: Number(e.target.value) };
                        handleUpdateLane({ speed: updated });
                      }}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-[var(--color-text-secondary)] text-xs">Unit</Label>
                    <EnumSelect
                      value={sp.unit}
                      options={SPEED_UNITS}
                      onValueChange={(v) => {
                        const updated = [...(lane.speed ?? [])];
                        updated[idx] = { ...sp, unit: v };
                        handleUpdateLane({ speed: updated });
                      }}
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section: Lane Link */}
      {lane.link && (
        <div className="pb-3 border-b border-[var(--color-glass-edge)]">
          <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
            Lane Link
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <Label className="text-[var(--color-text-secondary)] text-xs">Predecessor ID</Label>
              <Input
                type="number"
                value={lane.link.predecessorId ?? ''}
                readOnly
                className="h-7 text-xs bg-[var(--color-glass-1)] opacity-60"
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-[var(--color-text-secondary)] text-xs">Successor ID</Label>
              <Input
                type="number"
                value={lane.link.successorId ?? ''}
                readOnly
                className="h-7 text-xs bg-[var(--color-glass-1)] opacity-60"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RoadMarkEditor({
  mark,
  index,
  onChange,
}: {
  mark: OdrRoadMark;
  index: number;
  onChange: (updated: OdrRoadMark) => void;
}) {
  return (
    <div className="p-2 bg-[var(--color-glass-1)] space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[10px] py-0">
          #{index}
        </Badge>
        <Badge variant="outline" className="text-[10px] py-0">
          sOffset={mark.sOffset.toFixed(2)}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1">
          <Label className="text-[var(--color-text-secondary)] text-xs">Type</Label>
          <EnumSelect
            value={mark.type}
            options={ROAD_MARK_TYPES}
            onValueChange={(v) => onChange({ ...mark, type: v })}
            className="h-7 text-xs"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-[var(--color-text-secondary)] text-xs">Color</Label>
          <EnumSelect
            value={mark.color ?? 'standard'}
            options={ROAD_MARK_COLORS}
            onValueChange={(v) => onChange({ ...mark, color: v })}
            className="h-7 text-xs"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="grid gap-1">
          <Label className="text-[var(--color-text-secondary)] text-xs">Width (m)</Label>
          <Input
            type="number"
            step="0.01"
            value={mark.width ?? ''}
            onChange={(e) =>
              onChange({ ...mark, width: e.target.value ? Number(e.target.value) : undefined })
            }
            className="h-7 text-xs"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-[var(--color-text-secondary)] text-xs">Weight</Label>
          <EnumSelect
            value={mark.weight ?? 'standard'}
            options={ROAD_MARK_WEIGHTS}
            onValueChange={(v) => onChange({ ...mark, weight: v })}
            className="h-7 text-xs"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-[var(--color-text-secondary)] text-xs">Lane Change</Label>
          <EnumSelect
            value={mark.laneChange ?? 'none'}
            options={LANE_CHANGE_OPTIONS}
            onValueChange={(v) => onChange({ ...mark, laneChange: v })}
            className="h-7 text-xs"
          />
        </div>
      </div>
    </div>
  );
}
