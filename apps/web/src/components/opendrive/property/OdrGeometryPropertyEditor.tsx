import type { OdrGeometry } from '@osce/shared';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Badge } from '../../ui/badge';

interface OdrGeometryPropertyEditorProps {
  geometry: OdrGeometry;
  index: number;
  onUpdate: (updates: Partial<OdrGeometry>) => void;
}

export function OdrGeometryPropertyEditor({
  geometry,
  index,
  onUpdate,
}: OdrGeometryPropertyEditorProps) {
  const isReadOnly = geometry.type === 'poly3' || geometry.type === 'paramPoly3';

  return (
    <div className="space-y-4">
      {/* Section: Geometry Segment Header */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider">
            Geometry #{index}
          </h3>
          <Badge variant="secondary" className="text-[10px] py-0">
            {geometry.type}
          </Badge>
          {isReadOnly && (
            <Badge variant="outline" className="text-[10px] py-0 text-[var(--color-text-secondary)]">
              Read Only
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
              <Label className="text-[var(--color-text-secondary)] text-xs">Heading (rad)</Label>
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
              <Label className="text-[var(--color-text-secondary)] text-xs">Length</Label>
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
  geometry: OdrGeometry;
  onUpdate: (updates: Partial<OdrGeometry>) => void;
}) {
  return (
    <div className="pb-3 border-b border-[var(--color-glass-edge)]">
      <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
        Arc Parameters
      </h3>
      <div className="grid gap-1">
        <Label className="text-[var(--color-text-secondary)] text-xs">Curvature (1/m)</Label>
        <Input
          type="number"
          step="0.001"
          value={geometry.curvature ?? 0}
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
  geometry: OdrGeometry;
  onUpdate: (updates: Partial<OdrGeometry>) => void;
}) {
  return (
    <div className="pb-3 border-b border-[var(--color-glass-edge)]">
      <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
        Spiral Parameters
      </h3>
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1">
          <Label className="text-[var(--color-text-secondary)] text-xs">Curv Start (1/m)</Label>
          <Input
            type="number"
            step="0.001"
            value={geometry.curvStart ?? 0}
            onChange={(e) => onUpdate({ curvStart: Number(e.target.value) })}
            className="h-7 text-xs"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-[var(--color-text-secondary)] text-xs">Curv End (1/m)</Label>
          <Input
            type="number"
            step="0.001"
            value={geometry.curvEnd ?? 0}
            onChange={(e) => onUpdate({ curvEnd: Number(e.target.value) })}
            className="h-7 text-xs"
          />
        </div>
      </div>
    </div>
  );
}

function Poly3Fields({ geometry }: { geometry: OdrGeometry }) {
  return (
    <div className="pb-3 border-b border-[var(--color-glass-edge)]">
      <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
        Poly3 Coefficients
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {(['a', 'b', 'c', 'd'] as const).map((coeff) => (
          <div key={coeff} className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">{coeff}</Label>
            <Input
              type="number"
              value={geometry[coeff] ?? 0}
              readOnly
              className="h-7 text-xs bg-[var(--color-glass-1)] opacity-60"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ParamPoly3Fields({ geometry }: { geometry: OdrGeometry }) {
  return (
    <div className="space-y-4">
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
          ParamPoly3 U Coefficients
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {(['aU', 'bU', 'cU', 'dU'] as const).map((coeff) => (
            <div key={coeff} className="grid gap-1">
              <Label className="text-[var(--color-text-secondary)] text-xs">{coeff}</Label>
              <Input
                type="number"
                value={geometry[coeff] ?? 0}
                readOnly
                className="h-7 text-xs bg-[var(--color-glass-1)] opacity-60"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
          ParamPoly3 V Coefficients
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {(['aV', 'bV', 'cV', 'dV'] as const).map((coeff) => (
            <div key={coeff} className="grid gap-1">
              <Label className="text-[var(--color-text-secondary)] text-xs">{coeff}</Label>
              <Input
                type="number"
                value={geometry[coeff] ?? 0}
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
            value={geometry.pRange ?? 'normalized'}
            readOnly
            className="h-7 text-xs bg-[var(--color-glass-1)] opacity-60"
          />
        </div>
      </div>
    </div>
  );
}
