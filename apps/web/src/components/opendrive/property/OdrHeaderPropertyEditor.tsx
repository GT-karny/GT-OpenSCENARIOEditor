import type { OdrHeader } from '@osce/shared';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

interface OdrHeaderPropertyEditorProps {
  header: OdrHeader;
  onUpdate: (updates: Partial<OdrHeader>) => void;
}

export function OdrHeaderPropertyEditor({ header, onUpdate }: OdrHeaderPropertyEditorProps) {
  return (
    <div className="space-y-4">
      {/* Section: Identity */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
          Document Header
        </h3>
        <div className="space-y-2">
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">Name</Label>
            <Input
              value={header.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="h-7 text-xs"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">Date</Label>
            <Input
              value={header.date}
              onChange={(e) => onUpdate({ date: e.target.value })}
              className="h-7 text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <Label className="text-[var(--color-text-secondary)] text-xs">Rev Major</Label>
              <Input
                value={header.revMajor}
                readOnly
                className="h-7 text-xs bg-[var(--color-glass-1)] opacity-60"
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-[var(--color-text-secondary)] text-xs">Rev Minor</Label>
              <Input
                value={header.revMinor}
                readOnly
                className="h-7 text-xs bg-[var(--color-glass-1)] opacity-60"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section: Geo Reference */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
          Geo Reference
        </h3>
        <div className="grid gap-1">
          <Label className="text-[var(--color-text-secondary)] text-xs">Projection</Label>
          <textarea
            value={header.geoReference ?? ''}
            onChange={(e) => onUpdate({ geoReference: e.target.value })}
            rows={3}
            className="w-full rounded-none border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
          />
        </div>
      </div>

      {/* Section: Bounds */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
          Bounds
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">North</Label>
            <Input
              type="number"
              value={header.north ?? ''}
              onChange={(e) => onUpdate({ north: e.target.value ? Number(e.target.value) : undefined })}
              className="h-7 text-xs"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">South</Label>
            <Input
              type="number"
              value={header.south ?? ''}
              onChange={(e) => onUpdate({ south: e.target.value ? Number(e.target.value) : undefined })}
              className="h-7 text-xs"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">East</Label>
            <Input
              type="number"
              value={header.east ?? ''}
              onChange={(e) => onUpdate({ east: e.target.value ? Number(e.target.value) : undefined })}
              className="h-7 text-xs"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">West</Label>
            <Input
              type="number"
              value={header.west ?? ''}
              onChange={(e) => onUpdate({ west: e.target.value ? Number(e.target.value) : undefined })}
              className="h-7 text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
