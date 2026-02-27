import { useTranslation } from '@osce/i18n';
import type { ScenarioEntity } from '@osce/shared';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { EntityIcon } from '../entity/EntityIcon';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';

interface EntityPropertyEditorProps {
  entity: ScenarioEntity;
}

export function EntityPropertyEditor({ entity }: EntityPropertyEditorProps) {
  const { t } = useTranslation('common');
  const storeApi = useScenarioStoreApi();

  const handleNameChange = (name: string) => {
    storeApi.getState().updateEntity(entity.id, { name });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b">
        <EntityIcon type={entity.type} className="h-5 w-5" />
        <div>
          <p className="text-sm font-medium">{entity.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{entity.type}</p>
        </div>
      </div>

      <div className="grid gap-2">
        <Label className="text-xs">{t('labels.name')}</Label>
        <Input
          value={entity.name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      <div className="grid gap-2">
        <Label className="text-xs">{t('labels.type')}</Label>
        <Input value={entity.type} readOnly className="h-8 text-sm bg-muted" />
      </div>

      {entity.definition && 'kind' in entity.definition && (
        <DefinitionDetails definition={entity.definition as unknown as Record<string, unknown>} />
      )}
    </div>
  );
}

function DefinitionDetails({ definition }: { definition: Record<string, unknown> }) {
  const { t } = useTranslation('common');

  if (definition.kind === 'vehicle') {
    const def = definition as {
      vehicleCategory?: string;
      performance?: { maxSpeed?: number; maxAcceleration?: number; maxDeceleration?: number };
    };
    return (
      <div className="space-y-2">
        <div className="grid gap-1">
          <Label className="text-xs">{t('labels.category')}</Label>
          <Input
            value={String(def.vehicleCategory ?? '')}
            readOnly
            className="h-8 text-sm bg-muted"
          />
        </div>
        {def.performance && (
          <>
            <div className="grid gap-1">
              <Label className="text-xs">Max {t('labels.speed')} (m/s)</Label>
              <Input
                value={String(def.performance.maxSpeed ?? 0)}
                readOnly
                className="h-8 text-sm bg-muted"
              />
            </div>
          </>
        )}
      </div>
    );
  }

  if (definition.kind === 'pedestrian') {
    const def = definition as { pedestrianCategory?: string; mass?: number };
    return (
      <div className="space-y-2">
        <div className="grid gap-1">
          <Label className="text-xs">{t('labels.category')}</Label>
          <Input
            value={String(def.pedestrianCategory ?? '')}
            readOnly
            className="h-8 text-sm bg-muted"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Mass (kg)</Label>
          <Input
            value={String(def.mass ?? 0)}
            readOnly
            className="h-8 text-sm bg-muted"
          />
        </div>
      </div>
    );
  }

  return null;
}
