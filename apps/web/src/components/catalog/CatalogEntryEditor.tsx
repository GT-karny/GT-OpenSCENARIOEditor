import { useState } from 'react';
import { useTranslation } from '@osce/i18n';
import { useCatalogStore } from '../../stores/catalog-store';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { EnumSelect } from '../property/EnumSelect';
import {
  VEHICLE_CATEGORIES,
  PEDESTRIAN_CATEGORIES,
  MISC_OBJECT_CATEGORIES,
  CONTROLLER_TYPES,
} from '../../constants/osc-enum-values';
import type {
  CatalogEntry,
  VehicleDefinition,
  PedestrianDefinition,
  MiscObjectDefinition,
  ControllerDefinition,
  ControllerType,
  Maneuver,
  Route,
} from '@osce/shared';
import { cn } from '@/lib/utils';
import { ParameterDeclarationsEditor } from './ParameterDeclarationsEditor';
import { PropertiesEditor } from './PropertiesEditor';
import { EntityDiagramPanel, useDiagramHighlight } from './diagrams';
import type { HighlightKey } from './diagrams';
import { ManeuverFields } from './ManeuverFields';
import { ManeuverEventPanel } from './ManeuverEventPanel';
import { RouteFields } from './RouteFields';

interface HighlightProps {
  highlighted: HighlightKey;
  onHighlight: (key: HighlightKey) => void;
}

/** Wrapper that adds hover highlight to an input container */
function HL({
  hk,
  highlighted,
  onHighlight,
  children,
}: {
  hk: HighlightKey;
  children: React.ReactNode;
} & HighlightProps) {
  const isActive = hk != null && highlighted === hk;
  return (
    <div
      onMouseEnter={() => onHighlight(hk)}
      onMouseLeave={() => onHighlight(null)}
      className={isActive ? 'ring-1 ring-[var(--color-accent-vivid)] rounded-none' : ''}
    >
      {children}
    </div>
  );
}

export function CatalogEntryEditor() {
  const { t } = useTranslation('common');
  const selectedCatalogName = useCatalogStore((s) => s.selectedCatalogName);
  const selectedEntryIndex = useCatalogStore((s) => s.selectedEntryIndex);
  const catalogs = useCatalogStore((s) => s.catalogs);
  const updateEntry = useCatalogStore((s) => s.updateEntry);
  const { highlighted, setHighlighted } = useDiagramHighlight();
  const [maneuverEventIndex, setManeuverEventIndex] = useState<number | null>(null);
  const [maneuverActionIndex, setManeuverActionIndex] = useState<number | null>(null);
  const [maneuverTab, setManeuverTab] = useState<'event' | 'action'>('event');

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
  const hlProps: HighlightProps = { highlighted, onHighlight: setHighlighted };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left: Form */}
      <div className="w-[280px] shrink-0 overflow-auto p-3 space-y-3 border-r border-[var(--color-border-glass)]">
        {/* Name */}
        <div className="grid gap-1">
          <Label className="text-xs">{t('labels.name')}</Label>
          <Input
            value={def.name}
            onChange={(e) =>
              handleUpdate({ ...entry, definition: { ...def, name: e.target.value } } as CatalogEntry)
            }
            className={cn('h-7 text-xs', !def.name.trim() && 'border-destructive')}
          />
          {!def.name.trim() && (
            <p className="text-[10px] text-destructive">{t('catalog.emptyNameError')}</p>
          )}
          {doc && isDuplicateName(def.name, selectedEntryIndex!, doc.entries) && (
            <p className="text-[10px] text-yellow-500">{t('catalog.duplicateNameWarning')}</p>
          )}
        </div>

        {entry.catalogType === 'vehicle' && (
          <VehicleFields
            entry={entry as { catalogType: 'vehicle'; definition: VehicleDefinition }}
            onUpdate={handleUpdate}
            {...hlProps}
          />
        )}
        {entry.catalogType === 'pedestrian' && (
          <PedestrianFields
            entry={entry as { catalogType: 'pedestrian'; definition: PedestrianDefinition }}
            onUpdate={handleUpdate}
          />
        )}
        {entry.catalogType === 'miscObject' && (
          <MiscObjectFields
            entry={entry as { catalogType: 'miscObject'; definition: MiscObjectDefinition }}
            onUpdate={handleUpdate}
          />
        )}
        {entry.catalogType === 'controller' && (
          <ControllerFields
            entry={entry as { catalogType: 'controller'; definition: ControllerDefinition }}
            onUpdate={handleUpdate}
          />
        )}
        {entry.catalogType === 'route' && (
          <RouteFields
            entry={entry as { catalogType: 'route'; definition: Route }}
            onUpdate={handleUpdate}
          />
        )}
        {entry.catalogType === 'maneuver' && (
          <ManeuverFields
            entry={entry as { catalogType: 'maneuver'; definition: Maneuver }}
            onUpdate={handleUpdate}
            selectedEventIndex={maneuverEventIndex}
            onSelectEvent={setManeuverEventIndex}
            onSelectAction={(eventIdx, actionIdx) => {
              setManeuverEventIndex(eventIdx);
              setManeuverActionIndex(actionIdx);
              setManeuverTab('action');
            }}
          />
        )}

        {/* BoundingBox (only for entity types) */}
        {hasEntityShape(entry) && (
          <BoundingBoxEditor entry={entry} onUpdate={handleUpdate} {...hlProps} />
        )}

        {/* Parameter Declarations (maneuver handles its own) */}
        {entry.catalogType !== 'maneuver' && hasParameterDeclarations(def) && (
          <ParameterDeclarationsEditor
            parameters={getParameterDeclarations(def)}
            onChange={(params) =>
              handleUpdate({
                ...entry,
                definition: { ...def, parameterDeclarations: params },
              } as CatalogEntry)
            }
          />
        )}

        {/* Properties */}
        {hasProperties(def) && (
          <PropertiesEditor
            properties={def.properties}
            onChange={(props) =>
              handleUpdate({
                ...entry,
                definition: { ...def, properties: props },
              } as CatalogEntry)
            }
          />
        )}
      </div>

      {/* Right panel */}
      {hasEntityShape(entry) ? (
        <div className="flex-1 min-w-0 p-2 bg-[var(--color-bg-void,#050311)]">
          <EntityDiagramPanel
            definition={def as VehicleDefinition | PedestrianDefinition | MiscObjectDefinition}
            highlighted={highlighted}
            onHighlight={setHighlighted}
          />
        </div>
      ) : entry.catalogType === 'maneuver' ? (
        <div className="flex-1 min-w-0 overflow-auto bg-[var(--color-bg-void,#050311)]">
          <ManeuverEventPanel
            maneuver={def as Maneuver}
            selectedEventIndex={maneuverEventIndex}
            selectedActionIndex={maneuverActionIndex}
            activeTab={maneuverTab}
            onTabChange={setManeuverTab}
            onManeuverChange={(updated) =>
              handleUpdate({ ...entry, definition: updated } as CatalogEntry)
            }
            onSelectAction={setManeuverActionIndex}
          />
        </div>
      ) : entry.catalogType === 'route' ? (
        <div className="flex-1 min-w-0 p-4 bg-[var(--color-bg-void,#050311)] flex items-center justify-center">
          <p className="text-xs text-muted-foreground text-center max-w-48">
            {`Route catalog entry with ${(def as Route).waypoints.length} waypoint${(def as Route).waypoints.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      ) : (
        <div className="flex-1 min-w-0 p-4 bg-[var(--color-bg-void,#050311)] flex items-center justify-center">
          <p className="text-xs text-muted-foreground text-center max-w-48">
            {entry.catalogType === 'controller'
              ? t('catalog.controllerPlaceholder')
              : `${entry.catalogType.charAt(0).toUpperCase() + entry.catalogType.slice(1)} catalog entry`}
          </p>
        </div>
      )}
    </div>
  );
}

// --- Vehicle-specific fields ---

function VehicleFields({
  entry,
  onUpdate,
  highlighted,
  onHighlight,
}: {
  entry: { catalogType: 'vehicle'; definition: VehicleDefinition };
  onUpdate: (e: CatalogEntry) => void;
} & HighlightProps) {
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
          className="h-7 text-xs"
        />
      </div>

      {/* Performance */}
      <div className="space-y-1">
        <p className="text-[10px] font-medium text-muted-foreground">Performance</p>
        <div className="grid grid-cols-3 gap-1">
          <div className="grid gap-0.5">
            <Label className="text-[10px]">Max {t('labels.speed')}</Label>
            <Input
              type="number"
              value={def.performance.maxSpeed}
              onChange={(e) =>
                update({ performance: { ...def.performance, maxSpeed: Number(e.target.value) } })
              }
              className="h-6 text-[10px]"
            />
          </div>
          <div className="grid gap-0.5">
            <Label className="text-[10px]">Max Accel</Label>
            <Input
              type="number"
              value={def.performance.maxAcceleration}
              onChange={(e) =>
                update({ performance: { ...def.performance, maxAcceleration: Number(e.target.value) } })
              }
              className="h-6 text-[10px]"
            />
          </div>
          <div className="grid gap-0.5">
            <Label className="text-[10px]">Max Decel</Label>
            <Input
              type="number"
              value={def.performance.maxDeceleration}
              onChange={(e) =>
                update({ performance: { ...def.performance, maxDeceleration: Number(e.target.value) } })
              }
              className="h-6 text-[10px]"
            />
          </div>
        </div>
      </div>

      {/* Axles */}
      <div className="space-y-1">
        <p className="text-[10px] font-medium text-muted-foreground">Axles</p>
        <AxleRow
          label="Front"
          prefix="front-axle"
          axle={def.axles.frontAxle}
          onChange={(a) => update({ axles: { ...def.axles, frontAxle: a } })}
          highlighted={highlighted}
          onHighlight={onHighlight}
        />
        <AxleRow
          label="Rear"
          prefix="rear-axle"
          axle={def.axles.rearAxle}
          onChange={(a) => update({ axles: { ...def.axles, rearAxle: a } })}
          highlighted={highlighted}
          onHighlight={onHighlight}
        />
      </div>
    </>
  );
}

function AxleRow({
  label,
  prefix,
  axle,
  onChange,
  highlighted,
  onHighlight,
}: {
  label: string;
  prefix: 'front-axle' | 'rear-axle';
  axle: VehicleDefinition['axles']['frontAxle'];
  onChange: (a: VehicleDefinition['axles']['frontAxle']) => void;
} & HighlightProps) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] text-muted-foreground">{label} Axle</p>
      <div className="grid grid-cols-3 gap-1">
        <HL hk={`${prefix}-posX` as HighlightKey} highlighted={highlighted} onHighlight={onHighlight}>
          <Label className="text-[10px]">posX</Label>
          <Input
            type="number"
            value={axle.positionX}
            onChange={(e) => onChange({ ...axle, positionX: Number(e.target.value) })}
            className="h-6 text-[10px]"
          />
        </HL>
        <HL hk={`${prefix}-wheelDia` as HighlightKey} highlighted={highlighted} onHighlight={onHighlight}>
          <Label className="text-[10px]">wheelDia</Label>
          <Input
            type="number"
            value={axle.wheelDiameter}
            onChange={(e) => onChange({ ...axle, wheelDiameter: Number(e.target.value) })}
            className="h-6 text-[10px]"
          />
        </HL>
        <HL hk={`${prefix}-trackW` as HighlightKey} highlighted={highlighted} onHighlight={onHighlight}>
          <Label className="text-[10px]">trackW</Label>
          <Input
            type="number"
            value={axle.trackWidth}
            onChange={(e) => onChange({ ...axle, trackWidth: Number(e.target.value) })}
            className="h-6 text-[10px]"
          />
        </HL>
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
          className="h-7 text-xs"
        />
      </div>
      <div className="grid grid-cols-2 gap-1">
        <div className="grid gap-0.5">
          <Label className="text-[10px]">Mass (kg)</Label>
          <Input
            type="number"
            value={def.mass}
            onChange={(e) => update({ mass: Number(e.target.value) })}
            className="h-6 text-[10px]"
          />
        </div>
        <div className="grid gap-0.5">
          <Label className="text-[10px]">Model</Label>
          <Input
            value={def.model}
            onChange={(e) => update({ model: e.target.value })}
            className="h-6 text-[10px]"
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
          className="h-7 text-xs"
        />
      </div>
      <div className="grid gap-0.5">
        <Label className="text-[10px]">Mass (kg)</Label>
        <Input
          type="number"
          value={def.mass}
          onChange={(e) => update({ mass: Number(e.target.value) })}
          className="h-6 text-[10px]"
        />
      </div>
    </>
  );
}

// --- Controller-specific fields ---

function ControllerFields({
  entry,
  onUpdate,
}: {
  entry: { catalogType: 'controller'; definition: ControllerDefinition };
  onUpdate: (e: CatalogEntry) => void;
}) {
  const { t } = useTranslation('common');
  const def = entry.definition;

  const update = (partial: Partial<ControllerDefinition>) =>
    onUpdate({ ...entry, definition: { ...def, ...partial } });

  return (
    <>
      {/* Controller Type */}
      <div className="grid gap-1">
        <Label className="text-xs">{t('catalog.controllerType')}</Label>
        <EnumSelect
          value={def.controllerType ?? ''}
          options={['', ...CONTROLLER_TYPES]}
          onValueChange={(v) =>
            update({ controllerType: (v || undefined) as ControllerType | undefined })
          }
          className="h-7 text-xs"
        />
      </div>
    </>
  );
}

// --- Type guards for catalog entry features ---

/** Entity types that have boundingBox */
function hasEntityShape(entry: CatalogEntry): entry is
  | { catalogType: 'vehicle'; definition: VehicleDefinition }
  | { catalogType: 'pedestrian'; definition: PedestrianDefinition }
  | { catalogType: 'miscObject'; definition: MiscObjectDefinition } {
  return entry.catalogType === 'vehicle' || entry.catalogType === 'pedestrian' || entry.catalogType === 'miscObject';
}

/** Check if definition type supports parameterDeclarations */
function hasParameterDeclarations(def: CatalogEntry['definition']): boolean {
  return 'parameterDeclarations' in def;
}

/** Safely get parameterDeclarations from any definition type */
function getParameterDeclarations(def: CatalogEntry['definition']) {
  return ('parameterDeclarations' in def && def.parameterDeclarations) ? def.parameterDeclarations : [];
}

/** Check if entry name is duplicated within the same catalog */
function isDuplicateName(name: string, currentIndex: number, entries: CatalogEntry[]): boolean {
  if (!name.trim()) return false;
  return entries.some((e, i) => i !== currentIndex && e.definition.name === name);
}

/** Check if definition has properties */
function hasProperties(def: CatalogEntry['definition']): def is { properties: { name: string; value: string }[] } & CatalogEntry['definition'] {
  return 'properties' in def && Array.isArray(def.properties);
}

// --- BoundingBox editor (shared across entity types) ---

type EntityCatalogEntry =
  | { catalogType: 'vehicle'; definition: VehicleDefinition }
  | { catalogType: 'pedestrian'; definition: PedestrianDefinition }
  | { catalogType: 'miscObject'; definition: MiscObjectDefinition };

function BoundingBoxEditor({
  entry,
  onUpdate,
  highlighted,
  onHighlight,
}: {
  entry: EntityCatalogEntry;
  onUpdate: (e: CatalogEntry) => void;
} & HighlightProps) {
  const bb = entry.definition.boundingBox;

  const updateBB = (partial: Partial<typeof bb>) => {
    onUpdate({
      ...entry,
      definition: { ...entry.definition, boundingBox: { ...bb, ...partial } },
    } as CatalogEntry);
  };

  return (
    <div className="space-y-1">
      <p className="text-[10px] font-medium text-muted-foreground">BoundingBox</p>
      <div className="grid grid-cols-3 gap-1">
        <HL hk="bb-center-x" highlighted={highlighted} onHighlight={onHighlight}>
          <Label className="text-[10px]">Center X</Label>
          <Input
            type="number"
            value={bb.center.x}
            onChange={(e) => updateBB({ center: { ...bb.center, x: Number(e.target.value) } })}
            className="h-6 text-[10px]"
          />
        </HL>
        <HL hk="bb-center-y" highlighted={highlighted} onHighlight={onHighlight}>
          <Label className="text-[10px]">Center Y</Label>
          <Input
            type="number"
            value={bb.center.y}
            onChange={(e) => updateBB({ center: { ...bb.center, y: Number(e.target.value) } })}
            className="h-6 text-[10px]"
          />
        </HL>
        <HL hk="bb-center-z" highlighted={highlighted} onHighlight={onHighlight}>
          <Label className="text-[10px]">Center Z</Label>
          <Input
            type="number"
            value={bb.center.z}
            onChange={(e) => updateBB({ center: { ...bb.center, z: Number(e.target.value) } })}
            className="h-6 text-[10px]"
          />
        </HL>
      </div>
      <div className="grid grid-cols-3 gap-1">
        <HL hk="bb-width" highlighted={highlighted} onHighlight={onHighlight}>
          <Label className="text-[10px]">Width</Label>
          <Input
            type="number"
            value={bb.dimensions.width}
            onChange={(e) => updateBB({ dimensions: { ...bb.dimensions, width: Number(e.target.value) } })}
            className="h-6 text-[10px]"
          />
        </HL>
        <HL hk="bb-length" highlighted={highlighted} onHighlight={onHighlight}>
          <Label className="text-[10px]">Length</Label>
          <Input
            type="number"
            value={bb.dimensions.length}
            onChange={(e) => updateBB({ dimensions: { ...bb.dimensions, length: Number(e.target.value) } })}
            className="h-6 text-[10px]"
          />
        </HL>
        <HL hk="bb-height" highlighted={highlighted} onHighlight={onHighlight}>
          <Label className="text-[10px]">Height</Label>
          <Input
            type="number"
            value={bb.dimensions.height}
            onChange={(e) => updateBB({ dimensions: { ...bb.dimensions, height: Number(e.target.value) } })}
            className="h-6 text-[10px]"
          />
        </HL>
      </div>
    </div>
  );
}
