import type { OdrController } from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Button } from '../../../../components/ui/button';

interface OdrControllerPropertyEditorProps {
  controller: OdrController;
  onUpdate: (controllerId: string, updates: Partial<OdrController>) => void;
}

export function OdrControllerPropertyEditor({
  controller,
  onUpdate,
}: OdrControllerPropertyEditorProps) {
  const { t } = useTranslation('common');
  const controls = controller.controls ?? [];

  const updateControl = (index: number, patch: { signalId?: string; type?: string }) => {
    const updated = controls.map((c, i) => (i === index ? { ...c, ...patch } : c));
    onUpdate(controller.id, { controls: updated });
  };

  const addControl = () => {
    onUpdate(controller.id, { controls: [...controls, { signalId: '' }] });
  };

  const removeControl = (index: number) => {
    onUpdate(controller.id, { controls: controls.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      {/* Section: Identity */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider mb-3">
          {t('odrProperty.controller.title')}
        </h3>
        <div className="space-y-2">
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">
              {t('odrProperty.common.id')}
            </Label>
            <Input
              value={controller.id}
              readOnly
              className="h-7 text-xs bg-[var(--color-glass-1)] opacity-60"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">
              {t('odrProperty.common.name')}
            </Label>
            <Input
              value={controller.name}
              onChange={(e) => onUpdate(controller.id, { name: e.target.value })}
              className="h-7 text-xs"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[var(--color-text-secondary)] text-xs">
              {t('odrProperty.controller.sequence')}
            </Label>
            <Input
              type="number"
              min={0}
              value={controller.sequence ?? ''}
              onChange={(e) => {
                const raw = e.target.value;
                onUpdate(controller.id, {
                  sequence: raw === '' ? undefined : Math.max(0, Number(raw) || 0),
                });
              }}
              className="h-7 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Section: Controls */}
      <div className="pb-3 border-b border-[var(--color-glass-edge)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[var(--color-text-secondary)] text-xs font-display uppercase tracking-wider">
            {t('odrProperty.controller.controlsTitle')}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[11px]"
            onClick={addControl}
          >
            <Plus className="h-3 w-3 mr-1" />
            {t('odrProperty.controller.addControl')}
          </Button>
        </div>
        {controls.length === 0 ? (
          <p className="text-xs text-[var(--color-text-secondary)] italic">
            {t('odrProperty.controller.noControls')}
          </p>
        ) : (
          <div className="space-y-2">
            {controls.map((control, idx) => (
              <div key={idx} className="p-2 bg-[var(--color-glass-1)] space-y-2">
                <div className="flex items-start gap-2">
                  <div className="grid grid-cols-2 gap-2 flex-1">
                    <div className="grid gap-1">
                      <Label className="text-[var(--color-text-secondary)] text-xs">
                        {t('odrProperty.controller.signalId')}
                      </Label>
                      <Input
                        value={control.signalId}
                        onChange={(e) => updateControl(idx, { signalId: e.target.value })}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-[var(--color-text-secondary)] text-xs">
                        {t('odrProperty.common.type')}
                      </Label>
                      <Input
                        value={control.type ?? ''}
                        onChange={(e) =>
                          updateControl(idx, { type: e.target.value || undefined })
                        }
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('odrProperty.controller.removeControl')}
                    className="h-7 w-7 shrink-0 mt-5 text-red-400"
                    onClick={() => removeControl(idx)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
