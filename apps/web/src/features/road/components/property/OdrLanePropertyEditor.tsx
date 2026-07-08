import { useMemo, useState } from 'react';
import type {
  OdrLane,
  OdrLaneAccess,
  OdrLaneAdvisory,
  OdrLaneDirection,
  OdrLaneLinkRef,
  OdrLaneWidth,
  OdrRoadMark,
} from '@osce/shared';
import { ODR_ACCESS_RESTRICTION_TYPES, ODR_LANE_ADVISORIES, ODR_LANE_DIRECTIONS } from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Badge } from '../../../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
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
  'shared',
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
  'walking',
  'slipLane',
];

/**
 * 1.9 XSD deprecates these `e_laneType` values in favor of the listed
 * replacement. Kept selectable (round-trip / legacy files still use them) but
 * flagged in the UI. See Thirdparty/opendrive/1.9/.../OpenDRIVE_Lane.xsd notes.
 */
const LANE_TYPE_DEPRECATIONS: Readonly<Record<string, string>> = {
  sidewalk: 'walking',
  bidirectional: '@direction',
  special1: 'access restrictions',
  special2: 'access restrictions',
  special3: 'access restrictions',
  bus: 'access restrictions',
  taxi: 'access restrictions',
  HOV: 'access restrictions',
  mwyEntry: 'entry',
  mwyExit: 'exit',
};

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
  'black',
  'orange',
  'violet',
];

const ROAD_MARK_WEIGHTS: readonly string[] = ['standard', 'bold'];

const LANE_CHANGE_OPTIONS: readonly string[] = ['none', 'increase', 'decrease', 'both'];

const SPEED_UNITS: readonly string[] = ['m/s', 'km/h', 'mph'];

const LANE_DIRECTION_OPTIONS: readonly string[] = ['', ...ODR_LANE_DIRECTIONS];
const LANE_ADVISORY_OPTIONS: readonly string[] = ['', ...ODR_LANE_ADVISORIES];
const ACCESS_RULE_OPTIONS: readonly string[] = ['', 'allow', 'deny'];

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

  // Per OpenDRIVE 1.9 t_road_lanes_laneSection_center_lane, the center lane
  // (id 0) only carries type/level/link/roadMark — width/speed/access/
  // direction/advisory/dynamic*/roadWorks are left-/right-lane only.
  const isCenterLane = lane.id === 0;

  const deprecatedSuffix = t('odrProperty.lane.deprecatedSuffix');
  const laneTypeSuffixes = useMemo(
    () => Object.fromEntries(Object.keys(LANE_TYPE_DEPRECATIONS).map((k) => [k, deprecatedSuffix])),
    [deprecatedSuffix],
  );
  const laneTypeReplacement = LANE_TYPE_DEPRECATIONS[lane.type];

  const firstWidth = lane.width[0] ?? { sOffset: 0, a: 0, b: 0, c: 0, d: 0 };

  const handleAddSpeed = () => {
    handleUpdateLane({ speed: [...(lane.speed ?? []), { sOffset: 0, max: 40, unit: 'km/h' }] });
  };
  const handleRemoveSpeed = (idx: number) => {
    handleUpdateLane({ speed: (lane.speed ?? []).filter((_, i) => i !== idx) });
  };

  const handleAddAccess = () => {
    handleUpdateLane({ access: [...(lane.access ?? []), { sOffset: 0 }] });
  };

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
            <div className="flex items-center gap-2">
              <Label className="text-[var(--color-text-secondary)] text-xs">
                {t('odrProperty.common.type')}
              </Label>
              {laneTypeReplacement && (
                <Badge
                  variant="outline"
                  className="text-[9px] py-0 leading-4 text-[var(--color-warning)] border-[var(--color-warning)]"
                  title={t('odrProperty.lane.deprecatedTooltip', { replacement: laneTypeReplacement })}
                >
                  {t('odrProperty.lane.deprecatedBadge')}
                </Badge>
              )}
            </div>
            <EnumSelect
              value={lane.type}
              options={LANE_TYPES}
              optionSuffixes={laneTypeSuffixes}
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

      {/* Section: Lane Flags (left/right lanes only — center content model excludes these) */}
      {!isCenterLane && (
        <div className="pb-3 border-b border-[var(--color-glass-edge)]">
          <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
            {t('odrProperty.lane.flagsTitle')}
          </h3>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <Label className="text-[var(--color-text-secondary)] text-xs">
                  {t('odrProperty.lane.direction')}
                </Label>
                <EnumSelect
                  value={lane.direction ?? ''}
                  options={LANE_DIRECTION_OPTIONS}
                  onValueChange={(v) =>
                    handleUpdateLane({ direction: v === '' ? undefined : (v as OdrLaneDirection) })
                  }
                  className="h-7 text-xs"
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-[var(--color-text-secondary)] text-xs">
                  {t('odrProperty.lane.advisory')}
                </Label>
                <EnumSelect
                  value={lane.advisory ?? ''}
                  options={LANE_ADVISORY_OPTIONS}
                  onValueChange={(v) =>
                    handleUpdateLane({ advisory: v === '' ? undefined : (v as OdrLaneAdvisory) })
                  }
                  className="h-7 text-xs"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`lane-dynamic-type-${lane.id}`}
                checked={lane.dynamicLaneType ?? false}
                onChange={(e) =>
                  handleUpdateLane({ dynamicLaneType: e.target.checked ? true : undefined })
                }
                className="rounded-none"
              />
              <Label
                htmlFor={`lane-dynamic-type-${lane.id}`}
                className="text-[var(--color-text-secondary)] text-xs cursor-pointer"
              >
                {t('odrProperty.lane.dynamicLaneType')}
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`lane-dynamic-direction-${lane.id}`}
                checked={lane.dynamicLaneDirection ?? false}
                onChange={(e) =>
                  handleUpdateLane({ dynamicLaneDirection: e.target.checked ? true : undefined })
                }
                className="rounded-none"
              />
              <Label
                htmlFor={`lane-dynamic-direction-${lane.id}`}
                className="text-[var(--color-text-secondary)] text-xs cursor-pointer"
              >
                {t('odrProperty.lane.dynamicLaneDirection')}
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`lane-road-works-${lane.id}`}
                checked={lane.roadWorks ?? false}
                onChange={(e) => handleUpdateLane({ roadWorks: e.target.checked ? true : undefined })}
                className="rounded-none"
              />
              <Label
                htmlFor={`lane-road-works-${lane.id}`}
                className="text-[var(--color-text-secondary)] text-xs cursor-pointer"
              >
                {t('odrProperty.lane.roadWorks')}
              </Label>
            </div>
          </div>
        </div>
      )}

      {/* Section: Width (left/right lanes only) */}
      {!isCenterLane && (
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
      )}

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

      {/* Section: Speed Limits (left/right lanes only) */}
      {!isCenterLane && (
        <div className="pb-3 border-b border-[var(--color-glass-edge)]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider">
              {t('odrProperty.lane.speedLimitsTitle')}
            </h3>
            <button
              type="button"
              onClick={handleAddSpeed}
              className="text-[10px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              {t('odrProperty.lane.addSpeed')}
            </button>
          </div>
          {!lane.speed || lane.speed.length === 0 ? (
            <p className="text-xs text-[var(--color-text-secondary)] italic">
              {t('odrProperty.lane.noSpeedEntries')}
            </p>
          ) : (
            <div className="space-y-2">
              {lane.speed.map((sp, idx) => (
                <div key={idx} className="p-2 bg-[var(--color-glass-1)] space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] py-0">
                      sOffset={sp.sOffset.toFixed(2)}
                    </Badge>
                    <button
                      type="button"
                      aria-label={t('odrProperty.lane.deleteSpeed')}
                      onClick={() => handleRemoveSpeed(idx)}
                      className="text-[var(--color-text-secondary)] hover:text-[var(--color-warning)] text-xs"
                    >
                      ×
                    </button>
                  </div>
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
          )}
        </div>
      )}

      {/* Section: Access Restrictions (left/right lanes only) */}
      {!isCenterLane && (
        <div className="pb-3 border-b border-[var(--color-glass-edge)]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider">
              {t('odrProperty.lane.accessTitle')}
            </h3>
            <button
              type="button"
              onClick={handleAddAccess}
              className="text-[10px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              {t('odrProperty.lane.addAccessEntry')}
            </button>
          </div>
          {!lane.access || lane.access.length === 0 ? (
            <p className="text-xs text-[var(--color-text-secondary)] italic">
              {t('odrProperty.lane.noAccessEntries')}
            </p>
          ) : (
            <div className="space-y-2">
              {lane.access.map((entry, idx) => (
                <AccessEntryEditor
                  key={idx}
                  entry={entry}
                  onChange={(updated) => {
                    const arr = [...(lane.access ?? [])];
                    arr[idx] = updated;
                    handleUpdateLane({ access: arr });
                  }}
                  onRemove={() => {
                    const arr = (lane.access ?? []).filter((_, i) => i !== idx);
                    handleUpdateLane({ access: arr });
                  }}
                />
              ))}
            </div>
          )}
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

function AccessEntryEditor({
  entry,
  onChange,
  onRemove,
}: {
  entry: OdrLaneAccess;
  onChange: (updated: OdrLaneAccess) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation('common');

  const addRestriction = (type: string) => {
    onChange({ ...entry, restrictions: [...(entry.restrictions ?? []), { type }] });
  };
  const removeRestriction = (idx: number) => {
    onChange({ ...entry, restrictions: (entry.restrictions ?? []).filter((_, i) => i !== idx) });
  };

  return (
    <div className="p-2 bg-[var(--color-glass-1)] space-y-2">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-[10px] py-0">
          sOffset={entry.sOffset.toFixed(2)}
        </Badge>
        <button
          type="button"
          aria-label={t('odrProperty.lane.deleteAccessEntry')}
          onClick={onRemove}
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-warning)] text-xs"
        >
          ×
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1">
          <Label className="text-[var(--color-text-secondary)] text-xs">
            {t('odrProperty.lane.sOffset')}
          </Label>
          <Input
            type="number"
            step="0.1"
            min={0}
            value={entry.sOffset}
            onChange={(e) => onChange({ ...entry, sOffset: Number(e.target.value) })}
            className="h-7 text-xs"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-[var(--color-text-secondary)] text-xs">
            {t('odrProperty.common.rule')}
          </Label>
          <EnumSelect
            value={entry.rule ?? ''}
            options={ACCESS_RULE_OPTIONS}
            onValueChange={(v) =>
              onChange({ ...entry, rule: v === '' ? undefined : (v as 'allow' | 'deny') })
            }
            className="h-7 text-xs"
          />
        </div>
      </div>
      {entry.restriction && (
        <Badge variant="outline" className="text-[10px] py-0 opacity-70">
          {t('odrProperty.lane.legacyRestriction', { type: entry.restriction })}
        </Badge>
      )}
      <div className="grid gap-1">
        <Label className="text-[var(--color-text-secondary)] text-xs">
          {t('odrProperty.lane.restrictions')}
        </Label>
        <div className="flex flex-wrap items-center gap-1">
          {(entry.restrictions ?? []).map((r, i) => (
            <Badge key={i} variant="outline" className="text-[10px] py-0 flex items-center gap-1">
              {r.type ?? '—'}
              <button
                type="button"
                aria-label={t('odrProperty.lane.removeRestriction', { type: r.type ?? '' })}
                onClick={() => removeRestriction(i)}
                className="hover:text-[var(--color-warning)]"
              >
                ×
              </button>
            </Badge>
          ))}
          <Select value="" onValueChange={(v) => v && addRestriction(v)}>
            <SelectTrigger className="h-7 text-xs w-28">
              <SelectValue placeholder={t('odrProperty.lane.addRestriction')} />
            </SelectTrigger>
            <SelectContent>
              {ODR_ACCESS_RESTRICTION_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
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
