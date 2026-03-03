import { useTranslation } from '@osce/i18n';
import { useCatalogStore } from '../../stores/catalog-store';
import { cn } from '@/lib/utils';
import { Car, User, Box, Plus, Copy, Trash2 } from 'lucide-react';
import type { CatalogEntry, VehicleDefinition, PedestrianDefinition, MiscObjectDefinition } from '@osce/shared';

function entryIcon(entry: CatalogEntry) {
  switch (entry.catalogType) {
    case 'vehicle': return <Car className="h-3.5 w-3.5 shrink-0" />;
    case 'pedestrian': return <User className="h-3.5 w-3.5 shrink-0" />;
    case 'miscObject': return <Box className="h-3.5 w-3.5 shrink-0" />;
  }
}

function entrySubtitle(entry: CatalogEntry): string {
  const def = entry.definition;
  switch (def.kind) {
    case 'vehicle': return (def as VehicleDefinition).vehicleCategory;
    case 'pedestrian': return (def as PedestrianDefinition).pedestrianCategory;
    case 'miscObject': return (def as MiscObjectDefinition).miscObjectCategory;
    default: return '';
  }
}

export function CatalogEntryList() {
  const { t } = useTranslation('common');
  const selectedCatalogName = useCatalogStore((s) => s.selectedCatalogName);
  const selectedEntryIndex = useCatalogStore((s) => s.selectedEntryIndex);
  const selectEntry = useCatalogStore((s) => s.selectEntry);
  const addEntry = useCatalogStore((s) => s.addEntry);
  const removeEntry = useCatalogStore((s) => s.removeEntry);
  const duplicateEntry = useCatalogStore((s) => s.duplicateEntry);
  const catalogs = useCatalogStore((s) => s.catalogs);

  const doc = selectedCatalogName ? catalogs.get(selectedCatalogName) : null;

  if (!doc) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-xs text-muted-foreground text-center">
          {t('catalog.noCatalogs')}
        </p>
      </div>
    );
  }

  const handleAddEntry = () => {
    const newEntry: CatalogEntry = doc.catalogType === 'pedestrian'
      ? {
          catalogType: 'pedestrian',
          definition: {
            kind: 'pedestrian',
            name: `new_pedestrian_${doc.entries.length + 1}`,
            pedestrianCategory: 'pedestrian',
            mass: 80,
            model: '',
            parameterDeclarations: [],
            boundingBox: { center: { x: 0, y: 0, z: 0.9 }, dimensions: { width: 0.5, length: 0.6, height: 1.8 } },
            properties: [],
          },
        }
      : doc.catalogType === 'miscObject'
        ? {
            catalogType: 'miscObject',
            definition: {
              kind: 'miscObject',
              name: `new_object_${doc.entries.length + 1}`,
              miscObjectCategory: 'none',
              mass: 0,
              parameterDeclarations: [],
              boundingBox: { center: { x: 0, y: 0, z: 0.5 }, dimensions: { width: 1, length: 1, height: 1 } },
              properties: [],
            },
          }
        : {
            catalogType: 'vehicle',
            definition: {
              kind: 'vehicle',
              name: `new_vehicle_${doc.entries.length + 1}`,
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
            },
          };
    addEntry(selectedCatalogName!, newEntry);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[var(--color-border-glass)]">
        <button
          type="button"
          onClick={handleAddEntry}
          className="flex items-center gap-1 px-2 py-1 text-[10px] text-[var(--color-accent-1)] hover:bg-[var(--color-glass-2)] rounded transition-colors"
          title={t('catalog.addEntry')}
        >
          <Plus className="h-3 w-3" /> {t('buttons.add')}
        </button>
        {selectedEntryIndex !== null && (
          <>
            <button
              type="button"
              onClick={() => duplicateEntry(selectedCatalogName!, selectedEntryIndex)}
              className="flex items-center gap-1 px-2 py-1 text-[10px] text-muted-foreground hover:bg-[var(--color-glass-2)] rounded transition-colors"
              title={t('catalog.duplicateEntry')}
            >
              <Copy className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => removeEntry(selectedCatalogName!, selectedEntryIndex)}
              className="flex items-center gap-1 px-2 py-1 text-[10px] text-destructive hover:bg-[var(--color-glass-2)] rounded transition-colors"
              title={t('catalog.removeEntry')}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </>
        )}
      </div>

      {/* Entry list */}
      <div className="flex-1 overflow-auto">
        {doc.entries.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center p-4">
            {t('catalog.noEntries')}
          </p>
        ) : (
          doc.entries.map((entry, index) => {
            const isSelected = selectedEntryIndex === index;
            return (
              <div
                key={`${entry.definition.name}-${index}`}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 cursor-pointer text-xs border-b border-[var(--color-border-glass)] transition-colors',
                  isSelected
                    ? 'bg-[var(--color-accent-1)]/10 text-[var(--color-accent-1)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-2)]',
                )}
                onClick={() => selectEntry(index)}
              >
                {entryIcon(entry)}
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{entry.definition.name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{entrySubtitle(entry)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
