import type {
  OdrJunction,
  OdrJunctionType,
  OdrJunctionCrossPath,
  OdrJunctionCrossPathLaneLink,
  OdrJunctionRoadSection,
} from '@osce/shared';
import { ODR_JUNCTION_TYPES } from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { Trash2, Plus, AlertTriangle } from 'lucide-react';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { EnumSelect } from '../../../../components/form/EnumSelect';

const ORIENTATIONS: readonly string[] = ['+', '-', 'none'];

/** Parse a form value to a non-negative number (t_grEqZero); '' clears to undefined. */
const numGeq0 = (v: string): number | undefined => (v === '' ? undefined : Math.max(0, Number(v) || 0));
/** Parse a form value to any number (lane ids may be negative); '' clears to undefined. */
const numAny = (v: string): number | undefined => (v === '' ? undefined : Number(v));

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

  // crossPaths belong to common (default) / virtual junctions; roadSections to
  // crossing junctions (XSD t_junction_common/virtual vs t_junction_crossing).
  const showCrossPaths = type === 'default' || type === 'virtual';
  const showRoadSections = type === 'crossing';

  // --- Road section editing (updateJunction replaces the whole array; undoable) ---
  const roadSections = junction.roadSections ?? [];
  const setRoadSections = (next: OdrJunctionRoadSection[]) =>
    onUpdate(junction.id, { roadSections: next });
  const updateRoadSection = (idx: number, patch: Partial<OdrJunctionRoadSection>) =>
    setRoadSections(roadSections.map((rs, i) => (i === idx ? { ...rs, ...patch } : rs)));
  const removeRoadSection = (idx: number) =>
    setRoadSections(roadSections.filter((_, i) => i !== idx));
  const addRoadSection = () => setRoadSections([...roadSections, {}]);

  // --- Cross path editing ---
  const crossPaths = junction.crossPaths ?? [];
  const setCrossPaths = (next: OdrJunctionCrossPath[]) =>
    onUpdate(junction.id, { crossPaths: next });
  const updateCrossPath = (idx: number, patch: Partial<OdrJunctionCrossPath>) =>
    setCrossPaths(crossPaths.map((cp, i) => (i === idx ? { ...cp, ...patch } : cp)));
  const updateCrossPathLink = (
    idx: number,
    which: 'startLaneLink' | 'endLaneLink',
    patch: Partial<OdrJunctionCrossPathLaneLink>,
  ) =>
    setCrossPaths(
      crossPaths.map((cp, i) => (i === idx ? { ...cp, [which]: { ...cp[which], ...patch } } : cp)),
    );
  const removeCrossPath = (idx: number) => setCrossPaths(crossPaths.filter((_, i) => i !== idx));
  const addCrossPath = () =>
    setCrossPaths([...crossPaths, { startLaneLink: { s: 0 }, endLaneLink: { s: 0 } }]);

  // --- Connection editing (direct-junction linkedRoad) ---
  const updateConnection = (connId: string, patch: { linkedRoad?: string }) =>
    onUpdate(junction.id, {
      connections: junction.connections.map((c) => (c.id === connId ? { ...c, ...patch } : c)),
    });

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
                // Clear children the new @type's XSD content model forbids, in the
                // same undoable update, so the model + serialized output stay
                // schema-valid after the switch (matches build-junction.ts gating).
                // Switching away from virtual clears its virtual-only attrs.
                if (next !== 'virtual') {
                  updates.mainRoad = undefined;
                  updates.sStart = undefined;
                  updates.sEnd = undefined;
                  updates.orientation = undefined;
                }
                // crossPath is valid only on default/virtual; roadSection only on crossing.
                if (next !== 'default' && next !== 'virtual') {
                  updates.crossPaths = undefined;
                }
                if (next !== 'crossing') {
                  updates.roadSections = undefined;
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

      {/* Section: Cross paths (editable; common/virtual junctions) */}
      {showCrossPaths && (
        <div className="pb-3 border-b border-[var(--color-glass-edge)]">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider">
              {t('odrProperty.junction.crossPathsTitle')}
            </h3>
            <Badge variant="secondary" className="text-[10px] py-0">
              {crossPaths.length}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 ml-auto text-xs gap-1 px-2"
              onClick={addCrossPath}
            >
              <Plus className="h-3 w-3" />
              {t('odrProperty.junction.addCrossPath')}
            </Button>
          </div>
          <div className="space-y-2">
            {crossPaths.map((cp, idx) => (
              <div key={idx} className="p-2 bg-[var(--color-glass-1)] space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] py-0">
                    #{idx}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('odrProperty.junction.deleteCrossPath')}
                    title={t('odrProperty.junction.deleteCrossPath')}
                    className="h-6 w-6 ml-auto shrink-0 text-red-400"
                    onClick={() => removeCrossPath(idx)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <FieldText
                    label={t('odrProperty.junction.crossingRoad')}
                    value={cp.crossingRoad}
                    onChange={(v) => updateCrossPath(idx, { crossingRoad: v })}
                  />
                  <FieldText
                    label={t('odrProperty.junction.roadAtStart')}
                    value={cp.roadAtStart}
                    onChange={(v) => updateCrossPath(idx, { roadAtStart: v })}
                  />
                  <FieldText
                    label={t('odrProperty.junction.roadAtEnd')}
                    value={cp.roadAtEnd}
                    onChange={(v) => updateCrossPath(idx, { roadAtEnd: v })}
                  />
                </div>
                <CrossPathLaneLinkRow
                  label={t('odrProperty.junction.startLaneLink')}
                  link={cp.startLaneLink}
                  onChange={(patch) => updateCrossPathLink(idx, 'startLaneLink', patch)}
                />
                <CrossPathLaneLinkRow
                  label={t('odrProperty.junction.endLaneLink')}
                  link={cp.endLaneLink}
                  onChange={(patch) => updateCrossPathLink(idx, 'endLaneLink', patch)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section: Road sections (editable; crossing junctions) */}
      {showRoadSections && (
        <div className="pb-3 border-b border-[var(--color-glass-edge)]">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider">
              {t('odrProperty.junction.roadSectionsTitle')}
            </h3>
            <Badge variant="secondary" className="text-[10px] py-0">
              {roadSections.length}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 ml-auto text-xs gap-1 px-2"
              onClick={addRoadSection}
            >
              <Plus className="h-3 w-3" />
              {t('odrProperty.junction.addRoadSection')}
            </Button>
          </div>
          {roadSections.length === 0 && (
            <p className="flex items-center gap-1.5 text-[11px] text-[var(--color-warning)] mb-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {t('odrProperty.junction.roadSectionRequiredHint')}
            </p>
          )}
          <div className="space-y-2">
            {roadSections.map((rs, idx) => (
              <div key={idx} className="p-2 bg-[var(--color-glass-1)] space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] py-0">
                    #{idx}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('odrProperty.junction.deleteRoadSection')}
                    title={t('odrProperty.junction.deleteRoadSection')}
                    className="h-6 w-6 ml-auto shrink-0 text-red-400"
                    onClick={() => removeRoadSection(idx)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <FieldText
                    label={t('odrProperty.junction.roadId')}
                    value={rs.roadId}
                    onChange={(v) => updateRoadSection(idx, { roadId: v })}
                  />
                  <FieldNum
                    label={t('odrProperty.junction.sStart')}
                    value={rs.sStart}
                    onChange={(v) => updateRoadSection(idx, { sStart: numGeq0(v) })}
                  />
                  <FieldNum
                    label={t('odrProperty.junction.sEnd')}
                    value={rs.sEnd}
                    onChange={(v) => updateRoadSection(idx, { sEnd: numGeq0(v) })}
                  />
                </div>
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

                {/* Direct-junction linked road (editable) */}
                {type === 'direct' && (
                  <div className="grid gap-1">
                    <Label className="text-[var(--color-text-secondary)] text-xs">
                      {t('odrProperty.junction.linkedRoad')}
                    </Label>
                    <Input
                      value={conn.linkedRoad ?? ''}
                      onChange={(e) => updateConnection(conn.id, { linkedRoad: e.target.value })}
                      className="h-7 text-xs"
                    />
                  </div>
                )}

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

/** Compact labeled text field used by the cross-path / road-section rows. */
function FieldText({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid gap-1">
      <Label className="text-[var(--color-text-secondary)] text-[10px]">{label}</Label>
      <Input
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 text-xs"
      />
    </div>
  );
}

/** Compact labeled non-negative-number field. */
function FieldNum({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid gap-1">
      <Label className="text-[var(--color-text-secondary)] text-[10px]">{label}</Label>
      <Input
        type="number"
        min={0}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 text-xs"
      />
    </div>
  );
}

/** s / from / to editor for one cross-path laneLink (s ≥ 0; from/to are lane ids). */
function CrossPathLaneLinkRow({
  label,
  link,
  onChange,
}: {
  label: string;
  link: OdrJunctionCrossPathLaneLink;
  onChange: (patch: Partial<OdrJunctionCrossPathLaneLink>) => void;
}) {
  const { t } = useTranslation('common');
  return (
    <div>
      <p className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
        {label}
      </p>
      <div className="grid grid-cols-3 gap-2">
        <FieldNum
          label={t('odrProperty.junction.laneLinkS')}
          value={link.s}
          onChange={(v) => onChange({ s: numGeq0(v) })}
        />
        <div className="grid gap-1">
          <Label className="text-[var(--color-text-secondary)] text-[10px]">
            {t('odrProperty.junction.laneLinkFrom')}
          </Label>
          <Input
            type="number"
            value={link.from ?? ''}
            onChange={(e) => onChange({ from: numAny(e.target.value) })}
            className="h-7 text-xs"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-[var(--color-text-secondary)] text-[10px]">
            {t('odrProperty.junction.laneLinkTo')}
          </Label>
          <Input
            type="number"
            value={link.to ?? ''}
            onChange={(e) => onChange({ to: numAny(e.target.value) })}
            className="h-7 text-xs"
          />
        </div>
      </div>
    </div>
  );
}
