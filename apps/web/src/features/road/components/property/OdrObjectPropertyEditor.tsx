import type { OdrRoadObject } from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Badge } from '../../../../components/ui/badge';

interface OdrObjectPropertyEditorProps {
  object: OdrRoadObject;
}

const readOnlyInputClass = 'h-7 text-xs bg-[var(--color-glass-1)] opacity-60';

/**
 * Read-only property display for a document-authored `<object>` entry.
 * P3 scope is display-only — editing is deferred to P4 (see 1.9-P3 design
 * notes D4).
 */
export function OdrObjectPropertyEditor({ object }: OdrObjectPropertyEditorProps) {
  const { t } = useTranslation('common');

  const outlineCount = (object.outline ? 1 : 0) + (object.outlines?.length ?? 0);
  const markingCount = object.markings?.length ?? 0;
  const borderCount = object.borders?.length ?? 0;
  const hasContent = outlineCount > 0 || markingCount > 0 || borderCount > 0;

  const hasBoxDimensions =
    object.length !== undefined || object.width !== undefined || object.height !== undefined;

  return (
    <div className="space-y-4">
      {/* Section: Identity */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider">
            {t('odrProperty.object.title')}
          </h3>
          <Badge variant="outline" className="text-[10px] py-0 text-[var(--color-text-secondary)]">
            {t('odrProperty.common.readOnly')}
          </Badge>
        </div>
        <p className="text-[10px] text-[var(--color-text-tertiary)] mb-3">
          {t('odrProperty.object.documentObjectsHeader')}
        </p>
        <div className="space-y-2">
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">
              {t('odrProperty.common.id')}
            </Label>
            <Input value={object.id} readOnly className={readOnlyInputClass} />
          </div>
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">
              {t('odrProperty.common.name')}
            </Label>
            <Input value={object.name ?? ''} readOnly className={readOnlyInputClass} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <Label className="text-[var(--color-text-secondary)] text-xs">
                {t('odrProperty.common.type')}
              </Label>
              <Input value={object.type ?? ''} readOnly className={readOnlyInputClass} />
            </div>
            <div className="grid gap-1">
              <Label className="text-[var(--color-text-secondary)] text-xs">
                {t('odrProperty.object.subtype')}
              </Label>
              <Input value={object.subtype ?? ''} readOnly className={readOnlyInputClass} />
            </div>
          </div>
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">
              {t('odrProperty.object.dynamic')}
            </Label>
            <Input value={object.dynamic ?? ''} readOnly className={readOnlyInputClass} />
          </div>
        </div>
      </div>

      {/* Section: Position */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
          {t('odrProperty.object.positionTitle')}
        </h3>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">
              {t('odrProperty.object.s')}
            </Label>
            <Input type="number" value={object.s} readOnly className={readOnlyInputClass} />
          </div>
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">
              {t('odrProperty.object.t')}
            </Label>
            <Input type="number" value={object.t} readOnly className={readOnlyInputClass} />
          </div>
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">
              {t('odrProperty.object.zOffset')}
            </Label>
            <Input
              type="number"
              value={object.zOffset ?? 0}
              readOnly
              className={readOnlyInputClass}
            />
          </div>
        </div>
        <div className="grid gap-1">
          <Label className="text-[var(--color-text-secondary)] text-xs">
            {t('odrProperty.object.orientation')}
          </Label>
          <Input value={object.orientation ?? ''} readOnly className={readOnlyInputClass} />
        </div>
      </div>

      {/* Section: Rotation */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
          {t('odrProperty.object.rotationTitle')}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">
              {t('odrProperty.object.heading')}
            </Label>
            <Input type="number" value={object.hdg ?? 0} readOnly className={readOnlyInputClass} />
          </div>
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">
              {t('odrProperty.object.pitch')}
            </Label>
            <Input type="number" value={object.pitch ?? 0} readOnly className={readOnlyInputClass} />
          </div>
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">
              {t('odrProperty.object.roll')}
            </Label>
            <Input type="number" value={object.roll ?? 0} readOnly className={readOnlyInputClass} />
          </div>
        </div>
      </div>

      {/* Section: Dimensions (box, or cylinder when only radius is given) */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
          {t('odrProperty.object.dimensionsTitle')}
        </h3>
        {hasBoxDimensions ? (
          <div className="grid grid-cols-3 gap-2">
            <div className="grid gap-1">
              <Label className="text-[var(--color-text-secondary)] text-xs">
                {t('odrProperty.object.length')}
              </Label>
              <Input
                type="number"
                value={object.length ?? 0}
                readOnly
                className={readOnlyInputClass}
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-[var(--color-text-secondary)] text-xs">
                {t('odrProperty.object.width')}
              </Label>
              <Input
                type="number"
                value={object.width ?? 0}
                readOnly
                className={readOnlyInputClass}
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-[var(--color-text-secondary)] text-xs">
                {t('odrProperty.object.height')}
              </Label>
              <Input
                type="number"
                value={object.height ?? 0}
                readOnly
                className={readOnlyInputClass}
              />
            </div>
          </div>
        ) : object.radius !== undefined ? (
          <div className="grid grid-cols-3 gap-2">
            <div className="grid gap-1">
              <Label className="text-[var(--color-text-secondary)] text-xs">
                {t('odrProperty.object.radius')}
              </Label>
              <Input type="number" value={object.radius} readOnly className={readOnlyInputClass} />
            </div>
          </div>
        ) : (
          <p className="text-xs text-[var(--color-text-secondary)] italic">
            {t('odrProperty.object.noDimensions')}
          </p>
        )}
      </div>

      {/* Section: Repeat (count only — full editing is P4 scope) */}
      {object.repeat && object.repeat.length > 0 && (
        <div className="pb-3 border-b border-[var(--color-glass-edge)]">
          <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
            {t('odrProperty.object.repeatTitle')}
          </h3>
          <Badge variant="outline" className="text-[10px] py-0">
            {t('odrProperty.object.repeatCount', { count: object.repeat.length })}
          </Badge>
        </div>
      )}

      {/* Section: Validity */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
          {t('odrProperty.object.validityTitle')}
        </h3>
        {object.validity && object.validity.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {object.validity.map((v, i) => (
              <Badge key={i} variant="outline" className="text-[10px] py-0">
                {`${t('odrProperty.object.fromLane')}=${v.fromLane} · ${t('odrProperty.object.toLane')}=${v.toLane}${v.layer ? ` (${v.layer})` : ''}`}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--color-text-secondary)] italic">
            {t('odrProperty.object.noValidityDefined')}
          </p>
        )}
      </div>

      {/* Section: Content (outlines/markings/borders — counts only, P3 scope) */}
      {hasContent && (
        <div className="pb-1">
          <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
            {t('odrProperty.object.contentTitle')}
          </h3>
          <div className="flex flex-wrap gap-1">
            {outlineCount > 0 && (
              <Badge variant="outline" className="text-[10px] py-0">
                {t('odrProperty.object.outlinesCount', { count: outlineCount })}
              </Badge>
            )}
            {markingCount > 0 && (
              <Badge variant="outline" className="text-[10px] py-0">
                {t('odrProperty.object.markingsCount', { count: markingCount })}
              </Badge>
            )}
            {borderCount > 0 && (
              <Badge variant="outline" className="text-[10px] py-0">
                {t('odrProperty.object.bordersCount', { count: borderCount })}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
