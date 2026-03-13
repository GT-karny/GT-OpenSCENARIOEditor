import type { OdrSignal } from '@osce/shared';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { EnumSelect } from '../../property/EnumSelect';

const SIGNAL_ORIENTATIONS: readonly string[] = ['+', '-', 'none'];

interface OdrSignalPropertyEditorProps {
  signal: OdrSignal;
  roadId: string;
  onUpdate: (roadId: string, signalId: string, updates: Partial<OdrSignal>) => void;
}

export function OdrSignalPropertyEditor({
  signal,
  roadId,
  onUpdate,
}: OdrSignalPropertyEditorProps) {
  const handleUpdate = (updates: Partial<OdrSignal>) => {
    onUpdate(roadId, signal.id, updates);
  };

  return (
    <div className="space-y-4">
      {/* Section: Identity */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
          Signal Properties
        </h3>
        <div className="space-y-2">
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">ID</Label>
            <Input
              value={signal.id}
              readOnly
              className="h-7 text-xs bg-[var(--color-glass-1)] opacity-60"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">Name</Label>
            <Input
              value={signal.name ?? ''}
              onChange={(e) => handleUpdate({ name: e.target.value })}
              className="h-7 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Section: Position */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
          Position
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">s</Label>
            <Input
              type="number"
              step="0.1"
              value={signal.s}
              onChange={(e) => handleUpdate({ s: Number(e.target.value) })}
              className="h-7 text-xs"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">t</Label>
            <Input
              type="number"
              step="0.1"
              value={signal.t}
              onChange={(e) => handleUpdate({ t: Number(e.target.value) })}
              className="h-7 text-xs"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">zOffset</Label>
            <Input
              type="number"
              step="0.1"
              value={signal.zOffset ?? 0}
              onChange={(e) => handleUpdate({ zOffset: Number(e.target.value) })}
              className="h-7 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Section: Orientation & Behavior */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
          Orientation
        </h3>
        <div className="space-y-2">
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">Orientation</Label>
            <EnumSelect
              value={signal.orientation}
              options={SIGNAL_ORIENTATIONS}
              onValueChange={(v) => handleUpdate({ orientation: v })}
              className="h-7 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`signal-dynamic-${signal.id}`}
              checked={signal.dynamic === 'yes'}
              onChange={(e) => handleUpdate({ dynamic: e.target.checked ? 'yes' : 'no' })}
              className="rounded-none"
            />
            <Label
              htmlFor={`signal-dynamic-${signal.id}`}
              className="text-[var(--color-text-secondary)] text-xs cursor-pointer"
            >
              Dynamic
            </Label>
          </div>
        </div>
      </div>

      {/* Section: Classification */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
          Classification
        </h3>
        <div className="space-y-2">
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">Country</Label>
            <Input
              value={signal.country ?? ''}
              onChange={(e) => handleUpdate({ country: e.target.value })}
              className="h-7 text-xs"
              placeholder="e.g. OpenDRIVE, DEU, USA"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <Label className="text-[var(--color-text-secondary)] text-xs">Type</Label>
              <Input
                value={signal.type ?? ''}
                onChange={(e) => handleUpdate({ type: e.target.value })}
                className="h-7 text-xs"
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-[var(--color-text-secondary)] text-xs">Subtype</Label>
              <Input
                value={signal.subtype ?? ''}
                onChange={(e) => handleUpdate({ subtype: e.target.value })}
                className="h-7 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section: Value & Text */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
          Value
        </h3>
        <div className="space-y-2">
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">Value</Label>
            <Input
              type="number"
              value={signal.value ?? ''}
              onChange={(e) =>
                handleUpdate({ value: e.target.value ? Number(e.target.value) : undefined })
              }
              className="h-7 text-xs"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">Text</Label>
            <Input
              value={signal.text ?? ''}
              onChange={(e) => handleUpdate({ text: e.target.value })}
              className="h-7 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Section: Physical Dimensions */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
          Physical Dimensions
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">Width (m)</Label>
            <Input
              type="number"
              step="0.01"
              value={signal.width ?? ''}
              onChange={(e) =>
                handleUpdate({ width: e.target.value ? Number(e.target.value) : undefined })
              }
              className="h-7 text-xs"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">Height (m)</Label>
            <Input
              type="number"
              step="0.01"
              value={signal.height ?? ''}
              onChange={(e) =>
                handleUpdate({ height: e.target.value ? Number(e.target.value) : undefined })
              }
              className="h-7 text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
