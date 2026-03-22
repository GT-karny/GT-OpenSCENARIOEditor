import { Label } from '../../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { useMemo } from 'react';
import { useCatalogStore } from '../../../stores/catalog-store';

type RouteSourceMode = 'inline' | 'catalogRef';

export interface RouteSourceSelectorProps {
  mode: RouteSourceMode;
  catalogReference?: { catalogName: string; entryName: string };
  onModeChange: (mode: RouteSourceMode) => void;
  onCatalogReferenceChange: (ref: { catalogName: string; entryName: string }) => void;
}

export function RouteSourceSelector({
  mode,
  catalogReference,
  onModeChange,
  onCatalogReferenceChange,
}: RouteSourceSelectorProps) {
  // Subscribe to the raw catalogs Map, then derive names outside the selector
  // to avoid creating new arrays inside the Zustand selector (causes infinite loops).
  const catalogs = useCatalogStore((s) => s.catalogs);

  const catalogNames = useMemo(() => Array.from(catalogs.keys()), [catalogs]);

  const entryNames = useMemo(() => {
    if (!catalogReference?.catalogName) return [];
    const doc = catalogs.get(catalogReference.catalogName);
    if (!doc) return [];
    return doc.entries.map((e) => e.definition.name);
  }, [catalogs, catalogReference?.catalogName]);

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        <button
          type="button"
          className={`flex-1 h-7 text-xs rounded-none border transition-colors ${
            mode === 'inline'
              ? 'bg-[var(--color-accent-dim)] text-[var(--color-text-primary)] border-[var(--color-glass-edge-active)]'
              : 'bg-transparent text-[var(--color-text-secondary)] border-[var(--color-glass-edge)] hover:border-[var(--color-glass-edge-mid)]'
          }`}
          onClick={() => onModeChange('inline')}
        >
          Inline
        </button>
        <button
          type="button"
          className={`flex-1 h-7 text-xs rounded-none border transition-colors ${
            mode === 'catalogRef'
              ? 'bg-[var(--color-accent-dim)] text-[var(--color-text-primary)] border-[var(--color-glass-edge-active)]'
              : 'bg-transparent text-[var(--color-text-secondary)] border-[var(--color-glass-edge)] hover:border-[var(--color-glass-edge-mid)]'
          }`}
          onClick={() => onModeChange('catalogRef')}
        >
          Catalog Reference
        </button>
      </div>

      {mode === 'catalogRef' && (
        <div className="space-y-2">
          <div className="grid gap-1">
            <Label className="text-xs">Catalog Name</Label>
            {catalogNames.length > 0 ? (
              <Select
                value={catalogReference?.catalogName ?? ''}
                onValueChange={(v) =>
                  onCatalogReferenceChange({
                    catalogName: v,
                    entryName: '',
                  })
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select catalog..." />
                </SelectTrigger>
                <SelectContent>
                  {catalogNames.map((name) => (
                    <SelectItem key={name} value={name} className="text-sm">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-xs text-muted-foreground italic">No catalogs loaded</p>
            )}
          </div>

          {catalogReference?.catalogName && (
            <div className="grid gap-1">
              <Label className="text-xs">Entry Name</Label>
              {entryNames.length > 0 ? (
                <Select
                  value={catalogReference.entryName}
                  onValueChange={(v) =>
                    onCatalogReferenceChange({
                      catalogName: catalogReference.catalogName,
                      entryName: v,
                    })
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select entry..." />
                  </SelectTrigger>
                  <SelectContent>
                    {entryNames.map((name) => (
                      <SelectItem key={name} value={name} className="text-sm">
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  No entries in this catalog
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
