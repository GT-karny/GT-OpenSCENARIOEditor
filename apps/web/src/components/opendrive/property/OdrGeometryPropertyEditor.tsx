import type {
  OdrGeometry,
  OdrGeometryUpdate,
  OdrGeometryArc,
  OdrGeometrySpiral,
  OdrGeometryPoly3,
  OdrGeometryParamPoly3,
} from '@osce/shared';
import { convertGeometryType } from '@osce/opendrive';
import { useTranslation } from '@osce/i18n';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Badge } from '../../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

interface OdrGeometryPropertyEditorProps {
  geometry: OdrGeometry;
  index: number;
  onUpdate: (updates: OdrGeometryUpdate) => void;
}

const CONVERTIBLE_TYPES = ['line', 'arc', 'spiral'] as const;
type ConvertibleType = (typeof CONVERTIBLE_TYPES)[number];

function isConvertible(type: string): type is ConvertibleType {
  return (CONVERTIBLE_TYPES as readonly string[]).includes(type);
}

export function OdrGeometryPropertyEditor({
  geometry,
  index,
  onUpdate,
}: OdrGeometryPropertyEditorProps) {
  const { t } = useTranslation('common');
  const isReadOnly = geometry.type === 'poly3' || geometry.type === 'paramPoly3';

  const handleTypeChange = (newType: string) => {
    if (!isConvertible(newType) || newType === geometry.type) return;
    const converted = convertGeometryType(geometry, newType);
    onUpdate(converted);
  };

  return (
    <div className="space-y-4">
      {/* Section: Geometry Segment Header */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider">
            {t('odrProperty.geometry.title', { index })}
          </h3>
          {isConvertible(geometry.type) ? (
            <Select value={geometry.type} onValueChange={handleTypeChange}>
              <SelectTrigger className="h-6 w-24 text-[10px] rounded-none bg-[var(--color-glass-1)] border-[var(--color-glass-edge)] hover:bg-[var(--color-glass-hover)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                {CONVERTIBLE_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs rounded-none">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="secondary" className="text-[10px] py-0">
              {geometry.type}
            </Badge>
          )}
          {isReadOnly && (
            <Badge variant="outline" className="text-[10px] py-0 text-[var(--color-text-secondary)]">
              {t('odrProperty.geometry.readOnly')}
            </Badge>
          )}
        </div>

        {/* Common Fields */}
        <div className="space-y-2">
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">s (station)</Label>
            <Input
              type="number"
              value={geometry.s}
              readOnly
              className="h-7 text-xs bg-[var(--color-glass-1)] opacity-60"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <Label className="text-[var(--color-text-secondary)] text-xs">X</Label>
              <Input
                type="number"
                value={geometry.x}
                readOnly={isReadOnly}
                onChange={(e) => !isReadOnly && onUpdate({ x: Number(e.target.value) })}
                className={`h-7 text-xs ${isReadOnly ? 'bg-[var(--color-glass-1)] opacity-60' : ''}`}
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-[var(--color-text-secondary)] text-xs">Y</Label>
              <Input
                type="number"
                value={geometry.y}
                readOnly={isReadOnly}
                onChange={(e) => !isReadOnly && onUpdate({ y: Number(e.target.value) })}
                className={`h-7 text-xs ${isReadOnly ? 'bg-[var(--color-glass-1)] opacity-60' : ''}`}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <Label className="text-[var(--color-text-secondary)] text-xs">
                {t('odrProperty.geometry.heading')}
              </Label>
              <Input
                type="number"
                step="0.01"
                value={geometry.hdg}
                readOnly={isReadOnly}
                onChange={(e) => !isReadOnly && onUpdate({ hdg: Number(e.target.value) })}
                className={`h-7 text-xs ${isReadOnly ? 'bg-[var(--color-glass-1)] opacity-60' : ''}`}
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-[var(--color-text-secondary)] text-xs">
                {t('odrProperty.geometry.length')}
              </Label>
              <Input
                type="number"
                step="0.01"
                value={geometry.length}
                readOnly={isReadOnly}
                onChange={(e) => !isReadOnly && onUpdate({ length: Number(e.target.value) })}
                className={`h-7 text-xs ${isReadOnly ? 'bg-[var(--color-glass-1)] opacity-60' : ''}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Type-specific fields */}
      {geometry.type === 'arc' && (
        <ArcFields geometry={geometry} onUpdate={onUpdate} />
      )}
      {geometry.type === 'spiral' && (
        <SpiralFields geometry={geometry} onUpdate={onUpdate} />
      )}
      {geometry.type === 'poly3' && (
        <Poly3Fields geometry={geometry} />
      )}
      {geometry.type === 'paramPoly3' && (
        <ParamPoly3Fields geometry={geometry} />
      )}
    </div>
  );
}

function ArcFields({
  geometry,
  onUpdate,
}: {
  geometry: OdrGeometryArc;
  onUpdate: (updates: OdrGeometryUpdate) => void;
}) {
  const { t } = useTranslation('common');
  return (
    <div className="pb-3 border-b border-[var(--color-glass-edge)]">
      <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
        {t('odrProperty.geometry.arcParams')}
      </h3>
      <div className="grid gap-1">
        <Label className="text-[var(--color-text-secondary)] text-xs">
          {t('odrProperty.geometry.curvature')}
        </Label>
        <Input
          type="number"
          step="0.001"
          value={geometry.curvature}
          onChange={(e) => onUpdate({ curvature: Number(e.target.value) })}
          className="h-7 text-xs"
        />
      </div>
    </div>
  );
}

function SpiralFields({
  geometry,
  onUpdate,
}: {
  geometry: OdrGeometrySpiral;
  onUpdate: (updates: OdrGeometryUpdate) => void;
}) {
  const { t } = useTranslation('common');
  return (
    <div className="pb-3 border-b border-[var(--color-glass-edge)]">
      <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
        {t('odrProperty.geometry.spiralParams')}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1">
          <Label className="text-[var(--color-text-secondary)] text-xs">
            {t('odrProperty.geometry.curvStart')}
          </Label>
          <Input
            type="number"
            step="0.001"
            value={geometry.curvStart}
            onChange={(e) => onUpdate({ curvStart: Number(e.target.value) })}
            className="h-7 text-xs"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-[var(--color-text-secondary)] text-xs">
            {t('odrProperty.geometry.curvEnd')}
          </Label>
          <Input
            type="number"
            step="0.001"
            value={geometry.curvEnd}
            onChange={(e) => onUpdate({ curvEnd: Number(e.target.value) })}
            className="h-7 text-xs"
          />
        </div>
      </div>
    </div>
  );
}

function Poly3Fields({ geometry }: { geometry: OdrGeometryPoly3 }) {
  const { t } = useTranslation('common');
  return (
    <div className="pb-3 border-b border-[var(--color-glass-edge)]">
      <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
        {t('odrProperty.geometry.poly3Coeffs')}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {(['a', 'b', 'c', 'd'] as const).map((coeff) => (
          <div key={coeff} className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">{coeff}</Label>
            <Input
              type="number"
              value={geometry[coeff]}
              readOnly
              className="h-7 text-xs bg-[var(--color-glass-1)] opacity-60"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ParamPoly3Fields({ geometry }: { geometry: OdrGeometryParamPoly3 }) {
  const { t } = useTranslation('common');
  return (
    <div className="space-y-4">
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
          {t('odrProperty.geometry.paramPoly3UCoeffs')}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {(['aU', 'bU', 'cU', 'dU'] as const).map((coeff) => (
            <div key={coeff} className="grid gap-1">
              <Label className="text-[var(--color-text-secondary)] text-xs">{coeff}</Label>
              <Input
                type="number"
                value={geometry[coeff]}
                readOnly
                className="h-7 text-xs bg-[var(--color-glass-1)] opacity-60"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
          {t('odrProperty.geometry.paramPoly3VCoeffs')}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {(['aV', 'bV', 'cV', 'dV'] as const).map((coeff) => (
            <div key={coeff} className="grid gap-1">
              <Label className="text-[var(--color-text-secondary)] text-xs">{coeff}</Label>
              <Input
                type="number"
                value={geometry[coeff]}
                readOnly
                className="h-7 text-xs bg-[var(--color-glass-1)] opacity-60"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <div className="grid gap-1">
          <Label className="text-[var(--color-text-secondary)] text-xs">pRange</Label>
          <Input
            value={geometry.pRange}
            readOnly
            className="h-7 text-xs bg-[var(--color-glass-1)] opacity-60"
          />
        </div>
      </div>
    </div>
  );
}
