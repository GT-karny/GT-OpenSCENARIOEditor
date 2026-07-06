import type { OdrSignal } from '@osce/shared';
import type { SignalAssemblyMetadata } from '@osce/opendrive-engine';
import { useTranslation } from '@osce/i18n';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Button } from '../../../../components/ui/button';
import { EnumSelect } from '../../../../components/form/EnumSelect';
import { SignalAssemblyPreview } from './SignalAssemblyPreview';

const SIGNAL_ORIENTATIONS: readonly string[] = ['+', '-', 'none'];

interface OdrSignalPropertyEditorProps {
  signal: OdrSignal;
  roadId: string;
  onUpdate: (roadId: string, signalId: string, updates: Partial<OdrSignal>) => void;
  /** Assembly this signal belongs to (if any). */
  assembly?: SignalAssemblyMetadata;
  /** All signals in the assembly (for preview). */
  assemblySignals?: OdrSignal[];
  /** Selected head within the assembly. */
  selectedHeadId?: string;
  onSelectHead?: (signalId: string) => void;
  onAddHead?: () => void;
  onRemoveHead?: (signalId: string) => void;
  onChangePoleType?: (poleType: 'straight' | 'arm') => void;
  onChangeArmLength?: (length: number) => void;
  onChangeArmAngle?: (angle: number) => void;
  onCreateAssembly?: () => void;
}

export function OdrSignalPropertyEditor({
  signal,
  roadId,
  onUpdate,
  assembly,
  assemblySignals,
  selectedHeadId,
  onSelectHead,
  onAddHead,
  onRemoveHead,
  onChangePoleType,
  onChangeArmLength,
  onChangeArmAngle,
  onCreateAssembly,
}: OdrSignalPropertyEditorProps) {
  const { t } = useTranslation('common');
  const handleUpdate = (updates: Partial<OdrSignal>) => {
    onUpdate(roadId, signal.id, updates);
  };

  return (
    <div className="space-y-4">
      {/* Assembly Preview (when signal belongs to an assembly) */}
      {assembly && assemblySignals && onSelectHead && onAddHead && onRemoveHead && onChangePoleType && (
        <div className="pb-3 border-b border-[var(--color-glass-edge)]">
          <SignalAssemblyPreview
            assembly={assembly}
            signals={assemblySignals}
            selectedHeadId={selectedHeadId}
            onSelectHead={onSelectHead}
            onAddHead={onAddHead}
            onRemoveHead={onRemoveHead}
            onChangePoleType={onChangePoleType}
          />

          {/* Arm-specific controls */}
          {assembly.poleType === 'arm' && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="grid gap-1">
                <Label className="text-[var(--color-text-secondary)] text-xs">
                  {t('odrProperty.signal.armLength')}
                </Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={assembly.armLength ?? 3}
                  onChange={(e) => onChangeArmLength?.(Number(e.target.value))}
                  className="h-7 text-xs"
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-[var(--color-text-secondary)] text-xs">
                  {t('odrProperty.signal.armAngle')}
                </Label>
                <Input
                  type="number"
                  step="5"
                  value={Math.round(((assembly.armAngle ?? 0) * 180) / Math.PI)}
                  onChange={(e) =>
                    onChangeArmAngle?.((Number(e.target.value) * Math.PI) / 180)
                  }
                  className="h-7 text-xs"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Assembly button (when signal is standalone) */}
      {!assembly && onCreateAssembly && (
        <div className="pb-3 border-b border-[var(--color-glass-edge)]">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-7 text-xs rounded-none"
            onClick={onCreateAssembly}
          >
            {t('odrProperty.signal.createAssembly')}
          </Button>
        </div>
      )}

      {/* Section: Identity */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
          {t('odrProperty.signal.title')}
        </h3>
        <div className="space-y-2">
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">
              {t('odrProperty.common.id')}
            </Label>
            <Input
              value={signal.id}
              readOnly
              className="h-7 text-xs bg-[var(--color-glass-1)] opacity-60"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">
              {t('odrProperty.common.name')}
            </Label>
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
          {t('odrProperty.signal.positionTitle')}
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
          {t('odrProperty.signal.orientation')}
        </h3>
        <div className="space-y-2">
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">
              {t('odrProperty.signal.orientation')}
            </Label>
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
              {t('odrProperty.signal.dynamic')}
            </Label>
          </div>
        </div>
      </div>

      {/* Section: Classification */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
          {t('odrProperty.signal.classificationTitle')}
        </h3>
        <div className="space-y-2">
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">
              {t('odrProperty.signal.country')}
            </Label>
            <Input
              value={signal.country ?? ''}
              onChange={(e) => handleUpdate({ country: e.target.value })}
              className="h-7 text-xs"
              placeholder={t('odrProperty.signal.countryPlaceholder')}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <Label className="text-[var(--color-text-secondary)] text-xs">
                {t('odrProperty.common.type')}
              </Label>
              <Input
                value={signal.type ?? ''}
                onChange={(e) => handleUpdate({ type: e.target.value })}
                className="h-7 text-xs"
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-[var(--color-text-secondary)] text-xs">
                {t('odrProperty.signal.subtype')}
              </Label>
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
          {t('odrProperty.signal.value')}
        </h3>
        <div className="space-y-2">
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">
              {t('odrProperty.signal.value')}
            </Label>
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
            <Label className="text-[var(--color-text-secondary)] text-xs">
              {t('odrProperty.signal.text')}
            </Label>
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
          {t('odrProperty.signal.dimensionsTitle')}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">
              {t('odrProperty.common.widthM')}
            </Label>
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
            <Label className="text-[var(--color-text-secondary)] text-xs">
              {t('odrProperty.signal.height')}
            </Label>
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
