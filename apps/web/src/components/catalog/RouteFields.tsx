import { AlertTriangle, MapPin, Navigation2, Trash2 } from 'lucide-react';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { EnumSelect } from '../property/EnumSelect';
import { ROUTE_STRATEGIES } from '../../constants/osc-enum-values';
import { useCatalogStore } from '../../stores/catalog-store';
import { useRouteEditStore } from '../../stores/route-edit-store';
import type { CatalogEntry, Route, RouteStrategy, Waypoint } from '@osce/shared';

interface RouteFieldsProps {
  entry: { catalogType: 'route'; definition: Route };
  onUpdate: (entry: CatalogEntry) => void;
}

/** Format a waypoint position for display */
function formatPosition(wp: Waypoint): string {
  const pos = wp.position;
  switch (pos.type) {
    case 'lanePosition':
      return `Road ${pos.roadId}, Lane ${pos.laneId}, s=${pos.s}`;
    case 'worldPosition':
      return `(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)})`;
    case 'roadPosition':
      return `Road ${pos.roadId}, s=${pos.s}, t=${pos.t}`;
    case 'relativeObjectPosition':
      return `Rel ${pos.entityRef} (${pos.dx}, ${pos.dy})`;
    case 'relativeWorldPosition':
      return `RelW ${pos.entityRef} (${pos.dx}, ${pos.dy})`;
    case 'relativeLanePosition':
      return `RelLane ${pos.entityRef}, dLane=${pos.dLane}`;
    case 'relativeRoadPosition':
      return `RelRoad ${pos.entityRef}, ds=${pos.ds}`;
    case 'routePosition':
      return 'RoutePos';
    case 'geoPosition':
      return `Geo (${pos.latitude.toFixed(4)}, ${pos.longitude.toFixed(4)})`;
    default:
      return 'Unknown';
  }
}

export function RouteFields({ entry, onUpdate }: RouteFieldsProps) {
  const def = entry.definition;
  const selectedCatalogName = useCatalogStore((s) => s.selectedCatalogName);
  const selectedEntryIndex = useCatalogStore((s) => s.selectedEntryIndex);

  const routeEditActive = useRouteEditStore((s) => s.active);
  const routeEditSource = useRouteEditStore((s) => s.source);

  const isEditingThisRoute =
    routeEditActive &&
    routeEditSource?.type === 'catalog' &&
    routeEditSource.catalogName === selectedCatalogName &&
    routeEditSource.entryIndex === selectedEntryIndex;

  const handleToggleClosed = () => {
    onUpdate({
      ...entry,
      definition: { ...def, closed: !def.closed },
    });
  };

  const handleDeleteWaypoint = (index: number) => {
    const waypoints = def.waypoints.filter((_, i) => i !== index);
    onUpdate({
      ...entry,
      definition: { ...def, waypoints },
    });
  };

  const handleStrategyChange = (index: number, strategy: string) => {
    const waypoints = def.waypoints.map((wp, i) =>
      i === index ? { ...wp, routeStrategy: strategy as RouteStrategy } : wp,
    );
    onUpdate({
      ...entry,
      definition: { ...def, waypoints },
    });
  };

  const handleEditIn3D = () => {
    if (!selectedCatalogName || selectedEntryIndex === null) return;
    useRouteEditStore.getState().enterRouteEditMode(
      { type: 'catalog', catalogName: selectedCatalogName, entryIndex: selectedEntryIndex },
      def,
    );
  };

  return (
    <>
      {/* Closed toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          role="checkbox"
          aria-checked={def.closed}
          onClick={handleToggleClosed}
          className={
            'h-4 w-4 shrink-0 rounded-none border border-input transition-colors ' +
            (def.closed
              ? 'bg-primary border-primary'
              : 'bg-transparent hover:border-muted-foreground')
          }
        >
          {def.closed && (
            <svg
              className="h-4 w-4 text-primary-foreground"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 8l3 3 5-5" />
            </svg>
          )}
        </button>
        <Label className="text-xs cursor-pointer" onClick={handleToggleClosed}>
          Closed route (loop)
        </Label>
      </div>

      {/* Waypoints section */}
      <div className="space-y-1">
        <p className="text-[10px] font-medium text-muted-foreground">
          Waypoints ({def.waypoints.length})
        </p>

        {/* Warning for insufficient waypoints */}
        {def.waypoints.length < 2 && (
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-none bg-yellow-500/10 border border-yellow-500/30">
            <AlertTriangle className="h-3 w-3 text-yellow-500 shrink-0" />
            <span className="text-[10px] text-yellow-500">
              Route requires at least 2 waypoints
            </span>
          </div>
        )}

        {/* Waypoint list */}
        <div className="max-h-[200px] overflow-auto space-y-0.5">
          {def.waypoints.map((wp, i) => (
            <div
              key={i}
              className="group flex items-center gap-1 px-1.5 py-1 rounded-none hover:bg-[var(--color-glass-hover)] transition-colors"
            >
              {/* Index badge */}
              <span className="text-[10px] text-muted-foreground w-5 shrink-0 text-center font-mono">
                #{i}
              </span>

              {/* Position icon */}
              <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />

              {/* Position summary */}
              <span className="text-[10px] truncate flex-1 min-w-0" title={formatPosition(wp)}>
                {formatPosition(wp)}
              </span>

              {/* Strategy select */}
              <div className="w-[90px] shrink-0">
                <EnumSelect
                  value={wp.routeStrategy}
                  options={ROUTE_STRATEGIES}
                  onValueChange={(v) => handleStrategyChange(i, v)}
                  className="h-5 text-[10px]"
                />
              </div>

              {/* Delete button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={() => handleDeleteWaypoint(i)}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}

          {def.waypoints.length === 0 && (
            <p className="text-[10px] text-muted-foreground text-center py-2 italic">
              No waypoints defined
            </p>
          )}
        </div>
      </div>

      {/* Edit in 3D button */}
      <div className="pt-1">
        {isEditingThisRoute ? (
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-none bg-primary/10 border border-primary/30">
            <Navigation2 className="h-3 w-3 text-primary animate-pulse" />
            <span className="text-[10px] text-primary font-medium">
              Editing in 3D...
            </span>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full h-7 text-xs"
            onClick={handleEditIn3D}
            disabled={routeEditActive}
          >
            <Navigation2 className="h-3 w-3 mr-1.5" />
            Edit in 3D
          </Button>
        )}
      </div>
    </>
  );
}
