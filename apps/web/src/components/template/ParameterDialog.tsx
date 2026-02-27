import { useState, useMemo } from 'react';
import { useTranslation } from '@osce/i18n';
import type { UseCaseComponent, ComponentParameter } from '@osce/shared';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface ParameterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  useCase: UseCaseComponent | null;
  onApply: (params: Record<string, unknown>) => void;
}

export function ParameterDialog({ open, onOpenChange, useCase, onApply }: ParameterDialogProps) {
  const { t } = useTranslation(['useCases', 'actions']);

  const defaultParams = useMemo(() => {
    if (!useCase) return {};
    const params: Record<string, unknown> = {};
    for (const p of useCase.parameters) {
      params[p.name] = p.default;
    }
    return params;
  }, [useCase]);

  const [params, setParams] = useState<Record<string, unknown>>(defaultParams);

  // Reset params when useCase changes
  useMemo(() => {
    setParams(defaultParams);
  }, [defaultParams]);

  if (!useCase) return null;

  const updateParam = (name: string, value: unknown) => {
    setParams((prev) => ({ ...prev, [name]: value }));
  };

  const handleApply = () => {
    onApply(params);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t(`useCases:${useCase.nameKey}`, useCase.name)}</DialogTitle>
          <DialogDescription>
            {t(`useCases:${useCase.descriptionKey}`, useCase.description)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {useCase.parameters.map((param) => (
            <ParameterFieldRenderer
              key={param.name}
              param={param}
              value={params[param.name]}
              onChange={(v) => updateParam(param.name, v)}
            />
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ParameterFieldRendererProps {
  param: ComponentParameter;
  value: unknown;
  onChange: (value: unknown) => void;
}

function ParameterFieldRenderer({ param, value, onChange }: ParameterFieldRendererProps) {
  const { t } = useTranslation('actions');
  const label = t(param.nameKey, param.name);

  // Use slider for numeric params with visualHint or defined min/max
  const useSlider =
    param.type === 'number' &&
    param.min !== undefined &&
    param.max !== undefined &&
    (param.visualHint === 'slider' ||
      param.visualHint === 'speedGauge' ||
      param.visualHint === 'distanceLine' ||
      param.visualHint === 'timeDuration' ||
      param.visualHint === 'angleArc');

  if (param.type === 'enum' && param.enumValues) {
    return (
      <div className="grid gap-1.5">
        <Label className="text-xs">{label}</Label>
        <Select value={String(value)} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {param.enumValues.map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (param.type === 'boolean') {
    return (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4"
        />
        <Label className="text-xs">{label}</Label>
      </div>
    );
  }

  if (useSlider) {
    return (
      <div className="grid gap-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs">{label}</Label>
          <span className="text-xs text-muted-foreground">
            {Number(value).toFixed(param.step && param.step < 1 ? 1 : 0)}
            {param.unit ? ` ${param.unit}` : ''}
          </span>
        </div>
        <Slider
          value={[Number(value)]}
          onValueChange={([v]) => onChange(v)}
          min={param.min}
          max={param.max}
          step={param.step ?? 1}
        />
      </div>
    );
  }

  if (param.type === 'number') {
    return (
      <div className="grid gap-1.5">
        <Label className="text-xs">
          {label}
          {param.unit ? ` (${param.unit})` : ''}
        </Label>
        <Input
          type="number"
          value={String(value)}
          onChange={(e) => onChange(Number(e.target.value))}
          min={param.min}
          max={param.max}
          step={param.step}
        />
      </div>
    );
  }

  // string / entityRef / position fallback
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs">{label}</Label>
      <Input value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
