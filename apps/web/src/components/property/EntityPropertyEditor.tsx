import { useTranslation } from '@osce/i18n';
import type {
  ScenarioEntity,
  VehicleDefinition,
  PedestrianDefinition,
  MiscObjectDefinition,
} from '@osce/shared';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { EntityIcon } from '../entity/EntityIcon';
import { EnumSelect } from './EnumSelect';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';
import {
  VEHICLE_CATEGORIES,
  PEDESTRIAN_CATEGORIES,
  MISC_OBJECT_CATEGORIES,
} from '../../constants/osc-enum-values';

interface EntityPropertyEditorProps {
  entity: ScenarioEntity;
}

export function EntityPropertyEditor({ entity }: EntityPropertyEditorProps) {
  const { t } = useTranslation('common');
  const storeApi = useScenarioStoreApi();

  const handleNameChange = (name: string) => {
    storeApi.getState().updateEntity(entity.id, { name });
  };

  const handleDefinitionChange = (field: string, value: string) => {
    if (!entity.definition || !('kind' in entity.definition)) return;
    storeApi.getState().updateEntity(entity.id, {
      definition: { ...entity.definition, [field]: value },
    });
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

      {entity.definition && 'kind' in entity.definition &&
        (entity.definition.kind === 'vehicle' ||
          entity.definition.kind === 'pedestrian' ||
          entity.definition.kind === 'miscObject') && (
        <DefinitionDetails
          definition={entity.definition as VehicleDefinition | PedestrianDefinition | MiscObjectDefinition}
          onDefinitionChange={handleDefinitionChange}
        />
      )}
    </div>
  );
}

interface DefinitionDetailsProps {
  definition: VehicleDefinition | PedestrianDefinition | MiscObjectDefinition;
  onDefinitionChange: (field: string, value: string) => void;
}

function DefinitionDetails({ definition, onDefinitionChange }: DefinitionDetailsProps) {
  const { t } = useTranslation('common');

  if (definition.kind === 'vehicle') {
    return (
      <div className="space-y-2">
        <div className="grid gap-1">
          <Label className="text-xs">{t('labels.category')}</Label>
          <EnumSelect
            value={definition.vehicleCategory}
            options={VEHICLE_CATEGORIES}
            onValueChange={(v) => onDefinitionChange('vehicleCategory', v)}
            className="h-8 text-sm"
          />
        </div>
        {definition.performance && (
          <div className="grid gap-1">
            <Label className="text-xs">Max {t('labels.speed')} (m/s)</Label>
            <Input
              value={String(definition.performance.maxSpeed ?? 0)}
              readOnly
              className="h-8 text-sm bg-muted"
            />
          </div>
        )}
      </div>
    );
  }

  if (definition.kind === 'pedestrian') {
    return (
      <div className="space-y-2">
        <div className="grid gap-1">
          <Label className="text-xs">{t('labels.category')}</Label>
          <EnumSelect
            value={definition.pedestrianCategory}
            options={PEDESTRIAN_CATEGORIES}
            onValueChange={(v) => onDefinitionChange('pedestrianCategory', v)}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Mass (kg)</Label>
          <Input
            value={String(definition.mass ?? 0)}
            readOnly
            className="h-8 text-sm bg-muted"
          />
        </div>
      </div>
    );
  }

  if (definition.kind === 'miscObject') {
    return (
      <div className="space-y-2">
        <div className="grid gap-1">
          <Label className="text-xs">{t('labels.category')}</Label>
          <EnumSelect
            value={definition.miscObjectCategory}
            options={MISC_OBJECT_CATEGORIES}
            onValueChange={(v) => onDefinitionChange('miscObjectCategory', v)}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Mass (kg)</Label>
          <Input
            value={String(definition.mass ?? 0)}
            readOnly
            className="h-8 text-sm bg-muted"
          />
        </div>
      </div>
    );
  }

  return null;
}
