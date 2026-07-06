import type { OdrRoad, OdrRoadRule } from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Badge } from '../../../../components/ui/badge';
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

interface OdrRoadPropertyEditorProps {
  road: OdrRoad;
  onUpdate: (roadId: string, updates: Partial<OdrRoad>) => void;
}

export function OdrRoadPropertyEditor({ road, onUpdate }: OdrRoadPropertyEditorProps) {
  const { t } = useTranslation('common');
  const totalLength = road.planView.reduce((sum, g) => sum + g.length, 0);
  const isJunction = road.junction !== '-1' && road.junction !== '';

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

      {/* Section: Road Type */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
          {t('odrProperty.road.typeTitle')}
        </h3>
        {(road.type ?? []).length === 0 ? (
          <p className="text-xs text-[var(--color-text-secondary)] italic">
            {t('odrProperty.road.noTypeEntries')}
          </p>
        ) : (
          <div className="space-y-3">
            {(road.type ?? []).map((entry, idx) => (
              <div key={idx} className="space-y-2 p-2 bg-[var(--color-glass-1)]">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] py-0">
                    s={entry.s.toFixed(1)}
                  </Badge>
                </div>
                <div className="grid gap-1">
                  <Label className="text-[var(--color-text-secondary)] text-xs">
                    {t('odrProperty.common.type')}
                  </Label>
                  <EnumSelect
                    value={entry.type}
                    options={ROAD_TYPES}
                    onValueChange={(v) => {
                      const updated = [...(road.type ?? [])];
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
                      <Input
                        type="number"
                        value={entry.speed.max}
                        onChange={(e) => {
                          const updated = [...(road.type ?? [])];
                          updated[idx] = {
                            ...entry,
                            speed: { ...entry.speed!, max: Number(e.target.value) },
                          };
                          onUpdate(road.id, { type: updated });
                        }}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[var(--color-text-secondary)] text-xs">
                        {t('odrProperty.common.unit')}
                      </Label>
                      <EnumSelect
                        value={entry.speed.unit}
                        options={SPEED_UNITS}
                        onValueChange={(v) => {
                          const updated = [...(road.type ?? [])];
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
