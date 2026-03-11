import { useTranslation } from '@osce/i18n';
import type { Property } from '@osce/shared';
import { Input } from '../ui/input';
import { Plus, Trash2 } from 'lucide-react';

interface PropertiesEditorProps {
  properties: Property[];
  onChange: (props: Property[]) => void;
}

export function PropertiesEditor({ properties, onChange }: PropertiesEditorProps) {
  const { t } = useTranslation('common');

  const addProperty = () => {
    onChange([...properties, { name: '', value: '' }]);
  };

  const removeProperty = (index: number) => {
    onChange(properties.filter((_, i) => i !== index));
  };

  const updateProperty = (index: number, updates: Partial<Property>) => {
    onChange(properties.map((p, i) => (i === index ? { ...p, ...updates } : p)));
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium text-muted-foreground">
          {t('catalog.properties')}
        </p>
        <button
          type="button"
          onClick={addProperty}
          className="text-[10px] text-[var(--color-accent-1)] hover:underline flex items-center gap-0.5"
        >
          <Plus className="h-3 w-3" /> {t('catalog.addProperty')}
        </button>
      </div>
      {properties.length === 0 ? (
        <p className="text-[10px] text-muted-foreground italic">
          {t('catalog.noProperties')}
        </p>
      ) : (
        properties.map((prop, i) => (
          <div key={i} className="flex gap-1 items-center">
            <Input
              value={prop.name}
              placeholder={t('catalog.propertyName')}
              onChange={(e) => updateProperty(i, { name: e.target.value })}
              className="h-6 text-[10px] flex-1"
            />
            <Input
              value={prop.value}
              placeholder={t('catalog.propertyValue')}
              onChange={(e) => updateProperty(i, { value: e.target.value })}
              className="h-6 text-[10px] flex-1"
            />
            <button
              type="button"
              onClick={() => removeProperty(i)}
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
