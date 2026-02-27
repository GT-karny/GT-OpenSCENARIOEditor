import type { ScenarioEntity } from '@osce/shared';
import { PropertyField } from './PropertyField.js';

export interface EntityPropertiesProps {
  entity: ScenarioEntity;
  onUpdate?: (updates: Partial<ScenarioEntity>) => void;
}

export function EntityProperties({ entity, onUpdate }: EntityPropertiesProps) {
  const def = entity.definition;
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-cyan-800">Entity</div>
      <PropertyField
        label="Name"
        value={entity.name}
        onChange={(v) => onUpdate?.({ name: v })}
      />
      <PropertyField
        label="Type"
        value={entity.type}
        type="readonly"
      />
      <PropertyField
        label="Category"
        value={def.kind === 'vehicle' ? def.vehicleCategory : def.kind === 'pedestrian' ? def.pedestrianCategory : def.kind === 'miscObject' ? def.miscObjectCategory : 'unknown'}
        type="readonly"
      />
      {def.kind === 'vehicle' && (
        <>
          <PropertyField
            label="Max Speed"
            value={def.performance.maxSpeed}
            type="readonly"
          />
          <PropertyField
            label="Dimensions (L x W x H)"
            value={`${def.boundingBox.dimensions.length} x ${def.boundingBox.dimensions.width} x ${def.boundingBox.dimensions.height}`}
            type="readonly"
          />
        </>
      )}
      <PropertyField
        label="ID"
        value={entity.id}
        type="readonly"
      />
    </div>
  );
}
