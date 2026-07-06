import { useState } from 'react';
import type { OdrLane, OdrLaneWidth, OdrLaneLinkRef, OdrRoadMark } from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Badge } from '../../../../components/ui/badge';
import { EnumSelect } from '../../../../components/form/EnumSelect';

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

// Values are the OpenDRIVE XSD e_roadMarkType tokens (space-separated for compound
// marks). The serializer/parser and viewers use the same space form, so UI, viz, and
// serialize all agree. See Thirdparty/opendrive/1.9/.../OpenDRIVE_Lane.xsd.
export const ROAD_MARK_TYPES: readonly string[] = [
  'none',
  'solid',
  'broken',
  'solid solid',
  'solid broken',
  'broken solid',
  'broken broken',
  'botts dots',
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
  const { t } = useTranslation('common');
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
          {t('odrProperty.lane.title')}
        </h3>
        <div className="space-y-2">
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">
              {t('odrProperty.common.id')}
            </Label>
            <Input
              value={lane.id}
              readOnly
              className="h-7 text-xs bg-[var(--color-glass-1)] opacity-60"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">
              {t('odrProperty.common.type')}
            </Label>
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
              {t('odrProperty.lane.level')}
            </Label>
          </div>
        </div>
      </div>

      {/* Section: Width */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider">
            {t('odrProperty.lane.widthTitle')}
          </h3>
          <button
            type="button"
            onClick={() => setShowAdvancedWidth(!showAdvancedWidth)}
            className="text-[10px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            {showAdvancedWidth
              ? t('odrProperty.lane.simple')
              : t('odrProperty.lane.advanced')}
          </button>
        </div>
        {!showAdvancedWidth ? (
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">
              {t('odrProperty.lane.constantWidth')}
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
                {t('odrProperty.lane.noWidthEntries')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Section: Road Marks */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
          {t('odrProperty.lane.roadMarksTitle')}
        </h3>
        {lane.roadMarks.length === 0 ? (
          <p className="text-xs text-[var(--color-text-secondary)] italic">
            {t('odrProperty.lane.noRoadMarksDefined')}
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
            {t('odrProperty.lane.speedLimitsTitle')}
          </h3>
          <div className="space-y-2">
            {lane.speed.map((sp, idx) => (
              <div key={idx} className="p-2 bg-[var(--color-glass-1)] space-y-2">
                <Badge variant="outline" className="text-[10px] py-0">
                  sOffset={sp.sOffset.toFixed(2)}
                </Badge>
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-1">
                    <Label className="text-[var(--color-text-secondary)] text-xs">
                      {t('odrProperty.lane.maxSpeed')}
                    </Label>
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
                    <Label className="text-[var(--color-text-secondary)] text-xs">
                      {t('odrProperty.common.unit')}
                    </Label>
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

      {/* Section: Lane Link (read-only; all predecessor/successor refs) */}
      {lane.link && (lane.link.predecessors.length > 0 || lane.link.successors.length > 0) && (
        <div className="pb-3 border-b border-[var(--color-glass-edge)]">
          <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
            {t('odrProperty.lane.linkTitle')}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <LaneLinkRefList
              label={t('odrProperty.lane.predecessors')}
              refs={lane.link.predecessors}
            />
            <LaneLinkRefList label={t('odrProperty.lane.successors')} refs={lane.link.successors} />
          </div>
        </div>
      )}
    </div>
  );
}

function LaneLinkRefList({ label, refs }: { label: string; refs: readonly OdrLaneLinkRef[] }) {
  return (
    <div className="grid gap-1">
      <Label className="text-[var(--color-text-secondary)] text-xs">{label}</Label>
      {refs.length === 0 ? (
        <span className="text-[11px] text-[var(--color-text-secondary)] italic">—</span>
      ) : (
        <div className="flex flex-wrap gap-1">
          {refs.map((ref, i) => (
            <Badge key={i} variant="outline" className="text-[10px] py-0">
              {ref.id}
              {ref.layer && <span className="ml-1 opacity-70">{ref.layer}</span>}
            </Badge>
          ))}
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
  const { t } = useTranslation('common');
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
          <Label className="text-[var(--color-text-secondary)] text-xs">
            {t('odrProperty.common.type')}
          </Label>
          <EnumSelect
            value={mark.type}
            options={ROAD_MARK_TYPES}
            onValueChange={(v) => onChange({ ...mark, type: v })}
            className="h-7 text-xs"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-[var(--color-text-secondary)] text-xs">
            {t('odrProperty.lane.color')}
          </Label>
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
          <Label className="text-[var(--color-text-secondary)] text-xs">
            {t('odrProperty.common.widthM')}
          </Label>
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
          <Label className="text-[var(--color-text-secondary)] text-xs">
            {t('odrProperty.lane.weight')}
          </Label>
          <EnumSelect
            value={mark.weight ?? 'standard'}
            options={ROAD_MARK_WEIGHTS}
            onValueChange={(v) => onChange({ ...mark, weight: v })}
            className="h-7 text-xs"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-[var(--color-text-secondary)] text-xs">
            {t('odrProperty.lane.laneChange')}
          </Label>
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
