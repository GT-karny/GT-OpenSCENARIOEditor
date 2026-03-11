import { useTranslation } from '@osce/i18n';
import type { ParameterDeclaration } from '@osce/shared';
import { Input } from '../ui/input';
import { EnumSelect } from '../property/EnumSelect';
import { PARAMETER_TYPES } from '../../constants/osc-enum-values';
import { Plus, Trash2 } from 'lucide-react';
import type { ParameterType } from '@osce/shared';

interface ParameterDeclarationsEditorProps {
  parameters: ParameterDeclaration[];
  onChange: (params: ParameterDeclaration[]) => void;
}

export function ParameterDeclarationsEditor({
  parameters,
  onChange,
}: ParameterDeclarationsEditorProps) {
  const { t } = useTranslation('common');

  const addParameter = () => {
    onChange([
      ...parameters,
      {
        id: crypto.randomUUID(),
        name: '',
        parameterType: 'double',
        value: '',
      },
    ]);
  };

  const removeParameter = (index: number) => {
    onChange(parameters.filter((_, i) => i !== index));
  };

  const updateParameter = (index: number, updates: Partial<ParameterDeclaration>) => {
    onChange(parameters.map((p, i) => (i === index ? { ...p, ...updates } : p)));
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium text-muted-foreground">
          {t('catalog.parameterDeclarations')}
        </p>
        <button
          type="button"
          onClick={addParameter}
          className="text-[10px] text-[var(--color-accent-1)] hover:underline flex items-center gap-0.5"
        >
          <Plus className="h-3 w-3" /> {t('catalog.addParameter')}
        </button>
      </div>
      {parameters.length === 0 ? (
        <p className="text-[10px] text-muted-foreground italic">
          {t('catalog.noParameterDeclarations')}
        </p>
      ) : (
        parameters.map((param, i) => (
          <div key={param.id} className="flex gap-1 items-center">
            <Input
              value={param.name}
              placeholder="name"
              onChange={(e) => updateParameter(i, { name: e.target.value })}
              className="h-6 text-[10px] flex-1"
            />
            <EnumSelect
              value={param.parameterType}
              options={PARAMETER_TYPES}
              onValueChange={(v) =>
                updateParameter(i, { parameterType: v as ParameterType })
              }
              className="h-6 text-[10px] w-[90px]"
            />
            <Input
              value={param.value}
              placeholder="default"
              onChange={(e) => updateParameter(i, { value: e.target.value })}
              className="h-6 text-[10px] flex-1"
            />
            <button
              type="button"
              onClick={() => removeParameter(i)}
              className="text-destructive hover:text-destructive/80 px-0.5 shrink-0"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))
      )}
    </div>
  );
}
