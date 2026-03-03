import { useTranslation } from '@osce/i18n';
import { useCatalogStore } from '../../stores/catalog-store';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { EnumSelect } from '../property/EnumSelect';
import {
  VEHICLE_CATEGORIES,
  PEDESTRIAN_CATEGORIES,
  MISC_OBJECT_CATEGORIES,
} from '../../constants/osc-enum-values';
import type {
  CatalogEntry,
  VehicleDefinition,
  PedestrianDefinition,
  MiscObjectDefinition,
} from '@osce/shared';

export function CatalogEntryEditor() {
  const { t } = useTranslation('common');
  const selectedCatalogName = useCatalogStore((s) => s.selectedCatalogName);
  const selectedEntryIndex = useCatalogStore((s) => s.selectedEntryIndex);
  const catalogs = useCatalogStore((s) => s.catalogs);
  const updateEntry = useCatalogStore((s) => s.updateEntry);

  const doc = selectedCatalogName ? catalogs.get(selectedCatalogName) : null;
  const entry = doc && selectedEntryIndex !== null ? doc.entries[selectedEntryIndex] : null;

  if (!entry) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-xs text-muted-foreground text-center">
          {t('catalog.noEntrySelected')}
        </p>
      </div>
    );
  }

  const handleUpdate = (updated: CatalogEntry) => {
    if (selectedCatalogName && selectedEntryIndex !== null) {
      updateEntry(selectedCatalogName, selectedEntryIndex, updated);
    }
  };

  const def = entry.definition;

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      {/* Name */}
      <div className="grid gap-1">
        <Label className="text-xs">{t('labels.name')}</Label>
        <Input
          value={def.name}
          onChange={(e) =>
            handleUpdate({ ...entry, definition: { ...def, name: e.target.value } } as CatalogEntry)
          }
          className="h-8 text-sm"
        />
      </div>

      {def.kind === 'vehicle' && (
        <VehicleFields
          entry={entry as { catalogType: 'vehicle'; definition: VehicleDefinition }}
          onUpdate={handleUpdate}
        />
      )}
      {def.kind === 'pedestrian' && (
        <PedestrianFields
          entry={entry as { catalogType: 'pedestrian'; definition: PedestrianDefinition }}
          onUpdate={handleUpdate}
        />
      )}
      {def.kind === 'miscObject' && (
        <MiscObjectFields
          entry={entry as { catalogType: 'miscObject'; definition: MiscObjectDefinition }}
          onUpdate={handleUpdate}
        />
      )}

      {/* BoundingBox */}
      <BoundingBoxEditor entry={entry} onUpdate={handleUpdate} />

      {/* Parameter Declarations */}
      {def.parameterDeclarations.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{t('labels.parameters')}</p>
          {def.parameterDeclarations.map((pd, i) => (
            <div key={i} className="grid grid-cols-3 gap-1 text-xs">
              <span className="text-muted-foreground truncate">{pd.name}</span>
              <span className="text-muted-foreground">{pd.parameterType}</span>
              <span>{pd.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Properties */}
      {def.properties.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Properties</p>
          {def.properties.map((p, i) => (
            <div key={i} className="grid grid-cols-2 gap-1 text-xs">
              <span className="text-muted-foreground truncate">{p.name}</span>
              <span>{p.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Vehicle-specific fields ---

function VehicleFields({
  entry,
  onUpdate,
}: {
  entry: { catalogType: 'vehicle'; definition: VehicleDefinition };
  onUpdate: (e: CatalogEntry) => void;
}) {
  const { t } = useTranslation('common');
  const def = entry.definition;

  const update = (partial: Partial<VehicleDefinition>) =>
    onUpdate({ ...entry, definition: { ...def, ...partial } });

  return (
    <>
      {/* Category */}
      <div className="grid gap-1">
        <Label className="text-xs">{t('labels.category')}</Label>
        <EnumSelect
          value={def.vehicleCategory}
          options={VEHICLE_CATEGORIES}
          onValueChange={(v) => update({ vehicleCategory: v as VehicleDefinition['vehicleCategory'] })}
          className="h-8 text-sm"
        />
      </div>

      {/* Performance */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Performance</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="grid gap-1">
            <Label className="text-[10px]">Max {t('labels.speed')} (m/s)</Label>
            <Input
              type="number"
              value={def.performance.maxSpeed}
              onChange={(e) =>
                update({ performance: { ...def.performance, maxSpeed: Number(e.target.value) } })
              }
              className="h-7 text-xs"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[10px]">Max Accel (m/s²)</Label>
            <Input
              type="number"
              value={def.performance.maxAcceleration}
              onChange={(e) =>
                update({ performance: { ...def.performance, maxAcceleration: Number(e.target.value) } })
              }
              className="h-7 text-xs"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[10px]">Max Decel (m/s²)</Label>
            <Input
              type="number"
              value={def.performance.maxDeceleration}
              onChange={(e) =>
                update({ performance: { ...def.performance, maxDeceleration: Number(e.target.value) } })
              }
              className="h-7 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Axles */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Axles</p>
        <AxleRow
          label="Front"
          axle={def.axles.frontAxle}
          onChange={(a) => update({ axles: { ...def.axles, frontAxle: a } })}
        />
        <AxleRow
          label="Rear"
          axle={def.axles.rearAxle}
          onChange={(a) => update({ axles: { ...def.axles, rearAxle: a } })}
        />
      </div>
    </>
  );
}

function AxleRow({
  label,
  axle,
  onChange,
}: {
  label: string;
  axle: VehicleDefinition['axles']['frontAxle'];
  onChange: (a: VehicleDefinition['axles']['frontAxle']) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] text-muted-foreground">{label} Axle</p>
      <div className="grid grid-cols-3 gap-1">
        <div>
          <Label className="text-[10px]">posX</Label>
          <Input
            type="number"
            value={axle.positionX}
            onChange={(e) => onChange({ ...axle, positionX: Number(e.target.value) })}
            className="h-6 text-[10px]"
          />
        </div>
        <div>
          <Label className="text-[10px]">wheelDia</Label>
          <Input
            type="number"
            value={axle.wheelDiameter}
            onChange={(e) => onChange({ ...axle, wheelDiameter: Number(e.target.value) })}
            className="h-6 text-[10px]"
          />
        </div>
        <div>
          <Label className="text-[10px]">trackW</Label>
          <Input
            type="number"
            value={axle.trackWidth}
            onChange={(e) => onChange({ ...axle, trackWidth: Number(e.target.value) })}
            className="h-6 text-[10px]"
          />
        </div>
      </div>
    </div>
  );
}

// --- Pedestrian-specific fields ---

function PedestrianFields({
  entry,
  onUpdate,
}: {
  entry: { catalogType: 'pedestrian'; definition: PedestrianDefinition };
  onUpdate: (e: CatalogEntry) => void;
}) {
  const { t } = useTranslation('common');
  const def = entry.definition;

  const update = (partial: Partial<PedestrianDefinition>) =>
    onUpdate({ ...entry, definition: { ...def, ...partial } });

  return (
    <>
      <div className="grid gap-1">
        <Label className="text-xs">{t('labels.category')}</Label>
        <EnumSelect
          value={def.pedestrianCategory}
          options={PEDESTRIAN_CATEGORIES}
          onValueChange={(v) => update({ pedestrianCategory: v as PedestrianDefinition['pedestrianCategory'] })}
          className="h-8 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1">
          <Label className="text-xs">Mass (kg)</Label>
          <Input
            type="number"
            value={def.mass}
            onChange={(e) => update({ mass: Number(e.target.value) })}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Model</Label>
          <Input
            value={def.model}
            onChange={(e) => update({ model: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
      </div>
    </>
  );
}

// --- MiscObject-specific fields ---

function MiscObjectFields({
  entry,
  onUpdate,
}: {
  entry: { catalogType: 'miscObject'; definition: MiscObjectDefinition };
  onUpdate: (e: CatalogEntry) => void;
}) {
  const { t } = useTranslation('common');
  const def = entry.definition;

  const update = (partial: Partial<MiscObjectDefinition>) =>
    onUpdate({ ...entry, definition: { ...def, ...partial } });

  return (
    <>
      <div className="grid gap-1">
        <Label className="text-xs">{t('labels.category')}</Label>
        <EnumSelect
          value={def.miscObjectCategory}
          options={MISC_OBJECT_CATEGORIES}
          onValueChange={(v) => update({ miscObjectCategory: v as MiscObjectDefinition['miscObjectCategory'] })}
          className="h-8 text-sm"
        />
      </div>
      <div className="grid gap-1">
        <Label className="text-xs">Mass (kg)</Label>
        <Input
          type="number"
          value={def.mass}
          onChange={(e) => update({ mass: Number(e.target.value) })}
          className="h-8 text-sm"
        />
      </div>
    </>
  );
}

// --- BoundingBox editor (shared across all types) ---

function BoundingBoxEditor({
  entry,
  onUpdate,
}: {
  entry: CatalogEntry;
  onUpdate: (e: CatalogEntry) => void;
}) {
  const bb = entry.definition.boundingBox;

  const updateBB = (partial: Partial<typeof bb>) => {
    onUpdate({
      ...entry,
      definition: { ...entry.definition, boundingBox: { ...bb, ...partial } },
    } as CatalogEntry);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">BoundingBox</p>
      <div className="grid grid-cols-3 gap-1">
        <div>
          <Label className="text-[10px]">Center X</Label>
          <Input
            type="number"
            value={bb.center.x}
            onChange={(e) => updateBB({ center: { ...bb.center, x: Number(e.target.value) } })}
            className="h-6 text-[10px]"
          />
        </div>
        <div>
          <Label className="text-[10px]">Center Y</Label>
          <Input
            type="number"
            value={bb.center.y}
            onChange={(e) => updateBB({ center: { ...bb.center, y: Number(e.target.value) } })}
            className="h-6 text-[10px]"
          />
        </div>
        <div>
          <Label className="text-[10px]">Center Z</Label>
          <Input
            type="number"
            value={bb.center.z}
            onChange={(e) => updateBB({ center: { ...bb.center, z: Number(e.target.value) } })}
            className="h-6 text-[10px]"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1">
        <div>
          <Label className="text-[10px]">Width</Label>
          <Input
            type="number"
            value={bb.dimensions.width}
            onChange={(e) => updateBB({ dimensions: { ...bb.dimensions, width: Number(e.target.value) } })}
            className="h-6 text-[10px]"
          />
        </div>
        <div>
          <Label className="text-[10px]">Length</Label>
          <Input
            type="number"
            value={bb.dimensions.length}
            onChange={(e) => updateBB({ dimensions: { ...bb.dimensions, length: Number(e.target.value) } })}
            className="h-6 text-[10px]"
          />
        </div>
        <div>
          <Label className="text-[10px]">Height</Label>
          <Input
            type="number"
            value={bb.dimensions.height}
            onChange={(e) => updateBB({ dimensions: { ...bb.dimensions, height: Number(e.target.value) } })}
            className="h-6 text-[10px]"
          />
        </div>
      </div>
    </div>
  );
}
