import type { OdrJunction, OdrJunctionType } from '@osce/shared';
import { ODR_JUNCTION_TYPES } from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { Trash2 } from 'lucide-react';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { EnumSelect } from '../../../../components/form/EnumSelect';

const ORIENTATIONS: readonly string[] = ['+', '-', 'none'];

interface OdrJunctionPropertyEditorProps {
  junction: OdrJunction;
  onUpdate: (junctionId: string, updates: Partial<OdrJunction>) => void;
  /** Remove a connection by id (wires the store's removeJunctionConnection). */
  onRemoveConnection?: (junctionId: string, connectionId: string) => void;
}

export function OdrJunctionPropertyEditor({
  junction,
  onUpdate,
  onRemoveConnection,
}: OdrJunctionPropertyEditorProps) {
  const { t } = useTranslation('common');
  const type = junction.type ?? 'default';
  const numOrZero = (v: string) => Math.max(0, Number(v) || 0);

  return (
    <div className="space-y-4">
      {/* Section: Identity */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
          {t('odrProperty.junction.title')}
        </h3>
        <div className="space-y-2">
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">
              {t('odrProperty.common.id')}
            </Label>
            <Input
              value={junction.id}
              readOnly
              className="h-7 text-xs bg-[var(--color-glass-1)] opacity-60"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">
              {t('odrProperty.common.name')}
            </Label>
            <Input
              value={junction.name}
              onChange={(e) => onUpdate(junction.id, { name: e.target.value })}
              className="h-7 text-xs"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">
              {t('odrProperty.common.type')}
            </Label>
            <EnumSelect
              value={type}
              options={ODR_JUNCTION_TYPES}
              disabledOptions={
                junction.connections.length > 0
                  ? { crossing: t('odrProperty.junction.crossingDisabledTooltip') }
                  : undefined
              }
              onValueChange={(v) => {
                const next = v as OdrJunctionType;
                const updates: Partial<OdrJunction> = { type: next };
                // Switching away from virtual clears its virtual-only attrs
                // (undoable; keeps the model + serialized output schema-valid).
                if (next !== 'virtual') {
                  updates.mainRoad = undefined;
                  updates.sStart = undefined;
                  updates.sEnd = undefined;
                  updates.orientation = undefined;
                }
                onUpdate(junction.id, updates);
              }}
              className="h-7 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Section: Virtual-junction attributes (editable when type === 'virtual') */}
      {type === 'virtual' && (
        <div className="pb-3 border-b border-[var(--color-glass-edge)]">
          <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
            {t('odrProperty.junction.virtualTitle')}
          </h3>
          <div className="space-y-2">
            <div className="grid gap-1">
              <Label className="text-[var(--color-text-secondary)] text-xs">
                {t('odrProperty.junction.mainRoad')}
              </Label>
              <Input
                value={junction.mainRoad ?? ''}
                onChange={(e) => onUpdate(junction.id, { mainRoad: e.target.value })}
                className="h-7 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <Label className="text-[var(--color-text-secondary)] text-xs">
                  {t('odrProperty.junction.sStart')}
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={junction.sStart ?? ''}
                  onChange={(e) => onUpdate(junction.id, { sStart: numOrZero(e.target.value) })}
                  className="h-7 text-xs"
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-[var(--color-text-secondary)] text-xs">
                  {t('odrProperty.junction.sEnd')}
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={junction.sEnd ?? ''}
                  onChange={(e) => onUpdate(junction.id, { sEnd: numOrZero(e.target.value) })}
                  className="h-7 text-xs"
                />
              </div>
            </div>
            <div className="grid gap-1">
              <Label className="text-[var(--color-text-secondary)] text-xs">
                {t('odrProperty.junction.orientation')}
              </Label>
              <EnumSelect
                value={junction.orientation ?? '+'}
                options={ORIENTATIONS}
                onValueChange={(v) => onUpdate(junction.id, { orientation: v })}
                className="h-7 text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* Section: Cross paths (read-only summary; common/virtual junctions) */}
      {junction.crossPaths && junction.crossPaths.length > 0 && (
        <div className="pb-3 border-b border-[var(--color-glass-edge)]">
          <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
            {t('odrProperty.junction.crossPathsTitle')}
            <Badge variant="secondary" className="ml-2 text-[10px] py-0">
              {junction.crossPaths.length}
            </Badge>
          </h3>
          <div className="space-y-0.5">
            {junction.crossPaths.map((cp, idx) => (
              <div key={idx} className="flex items-center gap-2 text-[11px] pl-1">
                <span className="text-[var(--color-text-secondary)]">
                  {t('odrProperty.junction.crossingRoad')}
                </span>
                <span>{cp.crossingRoad ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section: Road sections (read-only summary; crossing junctions) */}
      {junction.roadSections && junction.roadSections.length > 0 && (
        <div className="pb-3 border-b border-[var(--color-glass-edge)]">
          <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
            {t('odrProperty.junction.roadSectionsTitle')}
            <Badge variant="secondary" className="ml-2 text-[10px] py-0">
              {junction.roadSections.length}
            </Badge>
          </h3>
          <div className="space-y-1">
            {junction.roadSections.map((rs, idx) => (
              <div key={idx} className="flex items-center gap-2 text-[11px] pl-1">
                <Badge variant="outline" className="text-[10px] py-0">
                  {t('odrProperty.junction.roadId')}: {rs.roadId ?? '—'}
                </Badge>
                <span className="text-[var(--color-text-secondary)]">
                  {t('odrProperty.junction.sRange', {
                    start: rs.sStart ?? '—',
                    end: rs.sEnd ?? '—',
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section: Connections */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
          {t('odrProperty.junction.connectionsTitle')}
          <Badge variant="secondary" className="ml-2 text-[10px] py-0">
            {junction.connections.length}
          </Badge>
        </h3>
        {junction.connections.length === 0 ? (
          <p className="text-xs text-[var(--color-text-secondary)] italic">
            {t('odrProperty.junction.noConnections')}
          </p>
        ) : (
          <div className="space-y-2">
            {junction.connections.map((conn) => (
              <div key={conn.id} className="p-2 bg-[var(--color-glass-1)] space-y-2">
                {/* Connection header */}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] py-0">
                    #{conn.id}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] py-0">
                    {conn.contactPoint}
                  </Badge>
                  {onRemoveConnection && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t('odrProperty.junction.deleteConnection')}
                      title={t('odrProperty.junction.deleteConnection')}
                      className="h-6 w-6 ml-auto shrink-0 text-red-400"
                      onClick={() => onRemoveConnection(junction.id, conn.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                {/* Connection details table */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div className="text-[var(--color-text-secondary)]">
                    {t('odrProperty.junction.incomingRoad')}
                  </div>
                  <div>{conn.incomingRoad}</div>
                  <div className="text-[var(--color-text-secondary)]">
                    {t('odrProperty.junction.connectingRoad')}
                  </div>
                  <div>{conn.connectingRoad}</div>
                  <div className="text-[var(--color-text-secondary)]">
                    {t('odrProperty.junction.contactPoint')}
                  </div>
                  <div>{conn.contactPoint}</div>
                </div>

                {/* Lane links */}
                {conn.laneLinks.length > 0 && (
                  <div className="mt-1">
                    <p className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
                      {t('odrProperty.junction.laneLinks')}
                    </p>
                    <div className="space-y-0.5">
                      {conn.laneLinks.map((ll, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[11px] pl-2">
                          <span className="text-[var(--color-text-secondary)]">
                            {t('odrProperty.junction.lane', { id: ll.from })}
                          </span>
                          <span className="text-[var(--color-text-secondary)]">&rarr;</span>
                          <span>{t('odrProperty.junction.lane', { id: ll.to })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
