import { useTranslation } from '@osce/i18n';
import type {
  ScenarioEntity,
  VehicleDefinition,
  PedestrianDefinition,
  MiscObjectDefinition,
  CatalogReference,
  ParameterAssignment,
  Property,
} from '@osce/shared';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { EntityIcon } from '../entity/EntityIcon';
import { EnumSelect } from './EnumSelect';
import { InitPropertyEditorContent } from './InitPropertyEditor';
import { useScenarioStore, useScenarioStoreApi } from '../../stores/use-scenario-store';
import { useEditorStore } from '../../stores/editor-store';
import { useCatalogStore } from '../../stores/catalog-store';
import { CatalogPicker } from '../catalog/CatalogPicker';
import { ParameterAssignmentEditor } from '../catalog/ParameterAssignmentEditor';
import { ResolvedEntryPreview } from '../catalog/ResolvedEntryPreview';
import {
  VEHICLE_CATEGORIES,
  PEDESTRIAN_CATEGORIES,
  MISC_OBJECT_CATEGORIES,
} from '../../constants/osc-enum-values';
import { useSpeedUnit } from '../../hooks/use-speed-unit';
import { PropertiesEditor } from '../catalog/PropertiesEditor';

type SourceMode = 'inline' | 'catalog';

interface EntityPropertyEditorProps {
  entity: ScenarioEntity;
}

export function EntityPropertyEditor({ entity }: EntityPropertyEditorProps) {
  const { t } = useTranslation('common');

  // Tab state persistence
  const activeTab = useEditorStore((s) => s.entityPropertyTab);
  const setActiveTab = useEditorStore((s) => s.setEntityPropertyTab);

  // Look up EntityInitActions by entity name
  const entityInit = useScenarioStore((s) =>
    s.document.storyboard.init.entityActions.find(
      (ea) => ea.entityRef === entity.name,
    ),
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-glass-edge)]">
        <EntityIcon type={entity.type} className="h-5 w-5" />
        <div>
          <p className="text-sm font-medium">{entity.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{entity.type}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'definition' | 'initialState')}>
        <TabsList className="w-full">
          <TabsTrigger value="definition" className="flex-1 text-[11px]">
            {t('labels.definitionTab')}
          </TabsTrigger>
          <TabsTrigger value="initialState" className="flex-1 text-[11px]">
            {t('labels.initialStateTab')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="definition">
          <EntityDefinitionContent entity={entity} />
        </TabsContent>

        <TabsContent value="initialState">
          {entityInit ? (
            <InitPropertyEditorContent entityInit={entityInit} />
          ) : (
            <p className="text-xs text-muted-foreground italic p-2">
              No initial state configured.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** Entity definition form (name, type, source mode, inline/catalog config). */
function EntityDefinitionContent({ entity }: { entity: ScenarioEntity }) {
  const { t } = useTranslation('common');
  const storeApi = useScenarioStoreApi();

  const def = entity.definition;
  const sourceMode: SourceMode = def.kind === 'catalogReference' ? 'catalog' : 'inline';

  const handleNameChange = (name: string) => {
    storeApi.getState().updateEntity(entity.id, { name });
  };

  const handleDefinitionChange = (field: string, value: string) => {
    if (!def || def.kind === 'catalogReference') return;
    storeApi.getState().updateEntity(entity.id, {
      definition: { ...def, [field]: value },
    });
  };

  const handlePropertiesChange = (properties: Property[]) => {
    if (!def || def.kind === 'catalogReference') return;
    storeApi.getState().updateEntity(entity.id, {
      definition: { ...def, properties },
    });
  };

  const handleSourceModeChange = (mode: string) => {
    const newMode = mode as SourceMode;
    if (newMode === 'catalog') {
      storeApi.getState().updateEntity(entity.id, {
        definition: {
          kind: 'catalogReference',
          catalogName: '',
          entryName: '',
          parameterAssignments: [],
        } satisfies CatalogReference,
      });
    } else {
      const defaultDef = createDefaultDefinition(entity.type);
      storeApi.getState().updateEntity(entity.id, { definition: defaultDef });
    }
  };

  const handleCatalogNameChange = (catalogName: string) => {
    if (def.kind !== 'catalogReference') return;
    storeApi.getState().updateEntity(entity.id, {
      definition: { ...def, catalogName, entryName: '', parameterAssignments: [] },
    });
  };

  const handleEntryNameChange = (entryName: string) => {
    if (def.kind !== 'catalogReference') return;
    storeApi.getState().updateEntity(entity.id, {
      definition: { ...def, entryName, parameterAssignments: [] },
    });
  };

  const handleParameterAssignmentsChange = (assignments: ParameterAssignment[]) => {
    if (def.kind !== 'catalogReference') return;
    storeApi.getState().updateEntity(entity.id, {
      definition: { ...def, parameterAssignments: assignments },
    });
  };

  const resolveReference = useCatalogStore((s) => s.resolveReference);
  const resolved = def.kind === 'catalogReference' ? resolveReference(def) : null;

  return (
    <div className="space-y-4">
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

      {/* Source mode toggle */}
      <div className="grid gap-1">
        <Label className="text-xs">{t('catalog.sourceMode')}</Label>
        <EnumSelect
          value={sourceMode}
          options={['inline', 'catalog']}
          onValueChange={handleSourceModeChange}
          className="h-8 text-sm"
        />
      </div>

      {/* Inline definition */}
      {sourceMode === 'inline' && def.kind !== 'catalogReference' && (
        <DefinitionDetails
          definition={def as VehicleDefinition | PedestrianDefinition | MiscObjectDefinition}
          onDefinitionChange={handleDefinitionChange}
          onPropertiesChange={handlePropertiesChange}
        />
      )}

      {/* Catalog reference */}
      {sourceMode === 'catalog' && def.kind === 'catalogReference' && (
        <div className="space-y-4">
          <CatalogPicker
            catalogName={def.catalogName}
            entryName={def.entryName}
            onCatalogNameChange={handleCatalogNameChange}
            onEntryNameChange={handleEntryNameChange}
          />

          {resolved && (
            <ParameterAssignmentEditor
              declarations={resolved.parameterDeclarations}
              assignments={def.parameterAssignments}
              onAssignmentsChange={handleParameterAssignmentsChange}
            />
          )}

          {def.catalogName && def.entryName && (
            <ResolvedEntryPreview catalogRef={def} />
          )}
        </div>
      )}
    </div>
  );
}

function createDefaultDefinition(type: string): VehicleDefinition | PedestrianDefinition | MiscObjectDefinition {
  switch (type) {
    case 'pedestrian':
      return {
        kind: 'pedestrian',
        name: '',
        pedestrianCategory: 'pedestrian',
        mass: 80,
        model: '',
        parameterDeclarations: [],
        boundingBox: { center: { x: 0, y: 0, z: 0.9 }, dimensions: { width: 0.5, length: 0.6, height: 1.8 } },
        properties: [],
      };
    case 'miscObject':
      return {
        kind: 'miscObject',
        name: '',
        miscObjectCategory: 'none',
        mass: 0,
        parameterDeclarations: [],
        boundingBox: { center: { x: 0, y: 0, z: 0.5 }, dimensions: { width: 1, length: 1, height: 1 } },
        properties: [],
      };
    default:
      return {
        kind: 'vehicle',
        name: '',
        vehicleCategory: 'car',
        parameterDeclarations: [],
        performance: { maxSpeed: 69, maxAcceleration: 5, maxDeceleration: 10 },
        boundingBox: { center: { x: 1.4, y: 0, z: 0.75 }, dimensions: { width: 2.0, length: 5.0, height: 1.5 } },
        axles: {
          frontAxle: { maxSteering: 0.52, wheelDiameter: 0.8, trackWidth: 1.68, positionX: 2.98, positionZ: 0.4 },
          rearAxle: { maxSteering: 0, wheelDiameter: 0.8, trackWidth: 1.68, positionX: 0, positionZ: 0.4 },
          additionalAxles: [],
        },
        properties: [],
      };
  }
}

interface DefinitionDetailsProps {
  definition: VehicleDefinition | PedestrianDefinition | MiscObjectDefinition;
  onDefinitionChange: (field: string, value: string) => void;
  onPropertiesChange: (properties: Property[]) => void;
}

function DefinitionDetails({ definition, onDefinitionChange, onPropertiesChange }: DefinitionDetailsProps) {
  const { t } = useTranslation('common');
  const { label: speedLabel, toDisplay } = useSpeedUnit();

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
            <Label className="text-xs">Max {t('labels.speed')} ({speedLabel})</Label>
            <Input
              value={String(toDisplay(definition.performance.maxSpeed ?? 0))}
              readOnly
              className="h-8 text-sm bg-muted"
            />
          </div>
        )}
        <PropertiesEditor
          properties={definition.properties}
          onChange={onPropertiesChange}
        />
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
        <PropertiesEditor
          properties={definition.properties}
          onChange={onPropertiesChange}
        />
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
        <PropertiesEditor
          properties={definition.properties}
          onChange={onPropertiesChange}
        />
      </div>
    );
  }

  return null;
}
