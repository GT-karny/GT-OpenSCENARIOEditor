import { useRef } from 'react';
import type { OdrRoad, OdrRoadRule, OdrRoadTypeEntry, OdrGeometryUpdate, OdrSpeedMaxSpecial } from '@osce/shared';
import { ODR_SPEED_MAX_SPECIALS } from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { EnumSelect } from '../../../../components/form/EnumSelect';

const ROAD_RULES: readonly string[] = ['RHT', 'LHT'];

const ROAD_TYPES: readonly string[] = [
  'unknown',
  'rural',
  'motorway',
  'town',
  'lowSpeed',
  'pedestrian',
  'bicycle',
  'townExpressway',
  'townCollector',
  'townArterial',
  'townPrivate',
  'townLocal',
  'townPlayStreet',
];

const SPEED_UNITS: readonly string[] = ['m/s', 'km/h', 'mph'];

// Speed-max kind: a real number, or one of the special t_maxSpeed literals.
const SPEED_MAX_KINDS: readonly string[] = ['numeric', ...ODR_SPEED_MAX_SPECIALS];

interface OdrRoadPropertyEditorProps {
  road: OdrRoad;
  onUpdate: (roadId: string, updates: Partial<OdrRoad>) => void;
  /** Append a geometry segment to the road's planView (Plan View → Add segment). */
  onAddGeometry?: (roadId: string, geometry: OdrGeometryUpdate) => void;
}

export function OdrRoadPropertyEditor({ road, onUpdate, onAddGeometry }: OdrRoadPropertyEditorProps) {
  const { t } = useTranslation('common');
  const totalLength = road.planView.reduce((sum, g) => sum + g.length, 0);
  const isJunction = road.junction !== '-1' && road.junction !== '';

  // Remembers the last numeric speed-max per road-type entry index so switching
  // numeric → special → numeric restores the prior value instead of resetting to 0.
  const lastNumericMax = useRef<Map<number, number>>(new Map());

  const typeEntries = road.type ?? [];

  const handleAddTypeEntry = () => {
    const last = typeEntries[typeEntries.length - 1];
    const entry: OdrRoadTypeEntry = {
      s: last ? last.s : 0,
      type: 'town',
      speed: { max: 40, unit: 'km/h' },
    };
    onUpdate(road.id, { type: [...typeEntries, entry] });
  };

  const handleRemoveTypeEntry = (idx: number) => {
    onUpdate(road.id, { type: typeEntries.filter((_, i) => i !== idx) });
  };

  const handleAddSegment = () => {
    if (!onAddGeometry) return;
    // The add-geometry command re-chains placement (s / x / y / hdg onto the end
    // of the previous segment) and refreshes road.length, so the caller only
    // supplies the segment shape. Keeping the pose math here too would be a second
    // source of truth that could drift from the command.
    onAddGeometry(road.id, { type: 'line', length: 50 });
  };

  return (
    <div className="space-y-4">
      {/* Section: Basic Properties */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
          {t('odrProperty.road.title')}
        </h3>
        <div className="space-y-2">
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">
              {t('odrProperty.common.id')}
            </Label>
            <Input
              value={road.id}
              readOnly
              className="h-7 text-xs bg-[var(--color-glass-1)] opacity-60"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">
              {t('odrProperty.common.name')}
            </Label>
            <Input
              value={road.name}
              onChange={(e) => onUpdate(road.id, { name: e.target.value })}
              className="h-7 text-xs"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">
              {t('odrProperty.common.rule')}
            </Label>
            <EnumSelect
              value={road.rule ?? 'RHT'}
              options={ROAD_RULES}
              onValueChange={(v) => onUpdate(road.id, { rule: v as OdrRoadRule })}
              className="h-7 text-xs"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">
              {t('odrProperty.road.junctionField')}
              {isJunction && (
                <Badge variant="secondary" className="ml-2 text-[10px] py-0">
                  {t('odrProperty.road.linked')}
                </Badge>
              )}
            </Label>
            <Input
              value={road.junction}
              readOnly={isJunction}
              className={`h-7 text-xs ${isJunction ? 'bg-[var(--color-glass-1)] opacity-60' : ''}`}
              onChange={(e) => {
                if (!isJunction) onUpdate(road.id, { junction: e.target.value });
              }}
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">
              {t('odrProperty.road.totalLength')}
            </Label>
            <Input
              value={totalLength.toFixed(3)}
              readOnly
              className="h-7 text-xs bg-[var(--color-glass-1)] opacity-60"
            />
          </div>
        </div>
      </div>

      {/* Section: Plan View */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider">
            {t('odrProperty.road.planViewTitle')}
          </h3>
          {onAddGeometry && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px]"
              onClick={handleAddSegment}
            >
              <Plus className="h-3 w-3 mr-1" />
              {t('odrProperty.road.addSegment')}
            </Button>
          )}
        </div>
        <p className="text-xs text-[var(--color-text-secondary)]">
          {t('odrProperty.road.segmentsCount', { count: road.planView.length })}
        </p>
      </div>

      {/* Section: Cross-Section Surface note (1.9 crossSectionSurface — authored values shown, sim approximates) */}
      {road.crossSectionSurface && (
        <div className="pb-3 border-b border-[var(--color-glass-edge)]">
          <div className="p-2 bg-[var(--color-glass-1)]">
            <p className="text-[11px] text-[var(--color-text-secondary)]">
              {t('odrProperty.road.crossSectionSurfaceNote')}
            </p>
          </div>
        </div>
      )}

      {/* Section: Road Type */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider">
            {t('odrProperty.road.typeTitle')}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[11px]"
            onClick={handleAddTypeEntry}
          >
            <Plus className="h-3 w-3 mr-1" />
            {t('odrProperty.road.addTypeEntry')}
          </Button>
        </div>
        {typeEntries.length === 0 ? (
          <p className="text-xs text-[var(--color-text-secondary)] italic">
            {t('odrProperty.road.noTypeEntries')}
          </p>
        ) : (
          <div className="space-y-3">
            {typeEntries.map((entry, idx) => (
              <div key={idx} className="space-y-2 p-2 bg-[var(--color-glass-1)]">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] py-0">
                    s={entry.s.toFixed(1)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('odrProperty.road.removeTypeEntry')}
                    className="h-6 w-6 ml-auto shrink-0 text-red-400"
                    onClick={() => handleRemoveTypeEntry(idx)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid gap-1">
                  <Label className="text-[var(--color-text-secondary)] text-xs">
                    {t('odrProperty.common.type')}
                  </Label>
                  <EnumSelect
                    value={entry.type}
                    options={ROAD_TYPES}
                    onValueChange={(v) => {
                      const updated = [...typeEntries];
                      updated[idx] = { ...entry, type: v };
                      onUpdate(road.id, { type: updated });
                    }}
                    className="h-7 text-xs"
                  />
                </div>
                {entry.speed && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-1">
                      <Label className="text-[var(--color-text-secondary)] text-xs">
                        {t('odrProperty.road.speedMax')}
                      </Label>
                      <div className="grid grid-cols-2 gap-1">
                        <EnumSelect
                          value={typeof entry.speed.max === 'number' ? 'numeric' : entry.speed.max}
                          options={SPEED_MAX_KINDS}
                          onValueChange={(kind) => {
                            const currentMax = entry.speed!.max;
                            // Leaving numeric: stash the value for later restore.
                            if (typeof currentMax === 'number') {
                              lastNumericMax.current.set(idx, currentMax);
                            }
                            const max: number | OdrSpeedMaxSpecial =
                              kind === 'numeric'
                                ? typeof currentMax === 'number'
                                  ? currentMax
                                  : (lastNumericMax.current.get(idx) ?? 0)
                                : (kind as OdrSpeedMaxSpecial);
                            const updated = [...typeEntries];
                            updated[idx] = { ...entry, speed: { ...entry.speed!, max } };
                            onUpdate(road.id, { type: updated });
                          }}
                          className="h-7 text-xs"
                        />
                        {typeof entry.speed.max === 'number' && (
                          <Input
                            type="number"
                            value={entry.speed.max}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              lastNumericMax.current.set(idx, val);
                              const updated = [...typeEntries];
                              updated[idx] = {
                                ...entry,
                                speed: { ...entry.speed!, max: val },
                              };
                              onUpdate(road.id, { type: updated });
                            }}
                            className="h-7 text-xs"
                          />
                        )}
                      </div>
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[var(--color-text-secondary)] text-xs">
                        {t('odrProperty.common.unit')}
                      </Label>
                      <EnumSelect
                        value={entry.speed.unit}
                        options={SPEED_UNITS}
                        onValueChange={(v) => {
                          const updated = [...typeEntries];
                          updated[idx] = {
                            ...entry,
                            speed: { ...entry.speed!, unit: v },
                          };
                          onUpdate(road.id, { type: updated });
                        }}
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section: Road Link */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
          {t('odrProperty.road.linkTitle')}
        </h3>
        {road.link ? (
          <div className="space-y-2">
            {road.link.predecessor && (
              <div className="p-2 bg-[var(--color-glass-1)]">
                <p className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
                  {t('odrProperty.road.predecessor')}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="text-[10px] py-0">
                    {road.link.predecessor.elementType}
                  </Badge>
                  <span>{t('odrProperty.road.linkId', { id: road.link.predecessor.elementId })}</span>
                  {road.link.predecessor.contactPoint && (
                    <span className="text-[var(--color-text-secondary)]">
                      @ {road.link.predecessor.contactPoint}
                    </span>
                  )}
                </div>
              </div>
            )}
            {road.link.successor && (
              <div className="p-2 bg-[var(--color-glass-1)]">
                <p className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
                  {t('odrProperty.road.successor')}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="text-[10px] py-0">
                    {road.link.successor.elementType}
                  </Badge>
                  <span>{t('odrProperty.road.linkId', { id: road.link.successor.elementId })}</span>
                  {road.link.successor.contactPoint && (
                    <span className="text-[var(--color-text-secondary)]">
                      @ {road.link.successor.contactPoint}
                    </span>
                  )}
                </div>
              </div>
            )}
            {!road.link.predecessor && !road.link.successor && (
              <p className="text-xs text-[var(--color-text-secondary)] italic">
                {t('odrProperty.road.noLinksDefined')}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-[var(--color-text-secondary)] italic">
            {t('odrProperty.road.noLinksDefined')}
          </p>
        )}
      </div>
    </div>
  );
}
