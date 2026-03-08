import type { ScenarioAction, RoutingAction, Position, Route, RouteStrategy } from '@osce/shared';
import { MapPin } from 'lucide-react';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { EnumSelect } from '../EnumSelect';
import { PositionEditor } from '../PositionEditor';
import { WaypointListItem } from './WaypointListItem';
import { RouteSourceSelector } from './RouteSourceSelector';
import { useRouteEditStore } from '../../../stores/route-edit-store';

type RouteSourceMode = 'inline' | 'catalogRef';

interface RoutingActionEditorProps {
  action: ScenarioAction;
  onUpdate: (partial: Partial<ScenarioAction>) => void;
}

/**
 * Convert the RoutingAction's inline route data to a full Route object
 * compatible with the route-edit-store.
 */
function toFullRoute(
  routeData: NonNullable<RoutingAction['route']>,
): Route {
  return {
    id: crypto.randomUUID(),
    name: routeData.name,
    closed: routeData.closed,
    waypoints: routeData.waypoints.map((wp) => ({
      position: wp.position,
      routeStrategy: wp.routeStrategy as RouteStrategy,
    })),
  };
}

export function RoutingActionEditor({ action, onUpdate }: RoutingActionEditorProps) {
  const inner = action.action as RoutingAction;

  // Route edit mode state
  const routeEditActive = useRouteEditStore((s) => s.active);
  const routeEditSource = useRouteEditStore((s) => s.source);

  const isEditingThisRoute =
    routeEditActive &&
    routeEditSource?.type === 'action' &&
    routeEditSource.actionId === action.id;

  // Determine route source mode for assignRoute variant
  const routeSourceMode: RouteSourceMode = inner.route ? 'inline' : 'catalogRef';

  const updateInner = (updates: Partial<RoutingAction>) => {
    onUpdate({
      action: { ...inner, ...updates },
    } as Partial<ScenarioAction>);
  };

  const handleVariantChange = (variant: string) => {
    const v = variant as RoutingAction['routeAction'];
    switch (v) {
      case 'assignRoute':
        updateInner({
          routeAction: 'assignRoute',
          route: inner.route ?? { name: '', closed: false, waypoints: [] },
          position: undefined,
        });
        break;
      case 'followToConnectingRoad':
        updateInner({
          routeAction: 'followToConnectingRoad',
          route: undefined,
          position: undefined,
        });
        break;
      case 'acquirePosition':
        updateInner({
          routeAction: 'acquirePosition',
          route: undefined,
          position: inner.position ?? { type: 'worldPosition', x: 0, y: 0 },
        });
        break;
    }
  };

  const handleRouteSourceModeChange = (mode: RouteSourceMode) => {
    if (mode === 'inline') {
      updateInner({
        route: inner.route ?? { name: '', closed: false, waypoints: [] },
      });
    } else {
      // Switch to catalog reference mode: clear inline route
      updateInner({
        route: undefined,
      });
    }
  };

  const handleCatalogReferenceChange = (ref: { catalogName: string; entryName: string }) => {
    updateInner({
      catalogReference: ref,
    } as Partial<RoutingAction>);
  };

  const handleWaypointDelete = (index: number) => {
    if (!inner.route) return;
    const waypoints = inner.route.waypoints.filter((_, i) => i !== index);
    updateInner({ route: { ...inner.route, waypoints } });
  };

  const handleWaypointStrategyChange = (index: number, strategy: RouteStrategy) => {
    if (!inner.route) return;
    const waypoints = inner.route.waypoints.map((wp, i) =>
      i === index ? { ...wp, routeStrategy: strategy } : wp,
    );
    updateInner({ route: { ...inner.route, waypoints } });
  };

  const handleEditIn3D = () => {
    if (!inner.route) return;
    const fullRoute = toFullRoute(inner.route);
    useRouteEditStore.getState().enterRouteEditMode(
      { type: 'action', actionId: action.id },
      fullRoute,
    );
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Route Action</p>
        <div className="grid gap-1">
          <Label className="text-xs">Variant</Label>
          <EnumSelect
            value={inner.routeAction}
            options={['assignRoute', 'followToConnectingRoad', 'acquirePosition']}
            onValueChange={handleVariantChange}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {inner.routeAction === 'assignRoute' && (
        <div className="space-y-2">
          {/* Route source selector */}
          <RouteSourceSelector
            mode={routeSourceMode}
            catalogReference={
              (inner as unknown as { catalogReference?: { catalogName: string; entryName: string } })
                .catalogReference
            }
            onModeChange={handleRouteSourceModeChange}
            onCatalogReferenceChange={handleCatalogReferenceChange}
          />

          {/* Inline route editor */}
          {routeSourceMode === 'inline' && inner.route && (
            <div className="space-y-2">
              <div className="grid gap-1">
                <Label className="text-xs">Route Name</Label>
                <Input
                  value={inner.route.name}
                  onChange={(e) =>
                    updateInner({ route: { ...inner.route!, name: e.target.value } })
                  }
                  className="h-8 text-sm"
                />
              </div>

              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={inner.route.closed}
                  onChange={(e) =>
                    updateInner({ route: { ...inner.route!, closed: e.target.checked } })
                  }
                />
                Closed
              </label>

              {/* Waypoint list */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">
                    Waypoints ({inner.route.waypoints.length})
                  </Label>
                </div>

                {inner.route.waypoints.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2">
                    No waypoints defined. Use &quot;Edit in 3D&quot; to add waypoints visually.
                  </p>
                ) : (
                  <div className="space-y-1 max-h-[200px] overflow-y-auto">
                    {inner.route.waypoints.map((wp, i) => (
                      <WaypointListItem
                        key={i}
                        index={i}
                        waypoint={wp}
                        isSelected={false}
                        onSelect={() => {
                          // Selection is handled in route edit mode via the store
                        }}
                        onDelete={() => handleWaypointDelete(i)}
                        onStrategyChange={(strategy) =>
                          handleWaypointStrategyChange(i, strategy)
                        }
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Edit in 3D button / active badge */}
              {isEditingThisRoute ? (
                <Badge variant="secondary" className="w-full justify-center py-1.5 text-xs">
                  <MapPin className="mr-1.5 h-3 w-3" />
                  Editing in 3D...
                </Badge>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleEditIn3D}
                  disabled={routeEditActive}
                >
                  <MapPin className="mr-1.5 h-3.5 w-3.5" />
                  Edit in 3D
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {inner.routeAction === 'followToConnectingRoad' && (
        <p className="text-xs text-muted-foreground italic">
          No additional parameters required.
        </p>
      )}

      {inner.routeAction === 'acquirePosition' && inner.position && (
        <PositionEditor
          position={inner.position}
          onChange={(pos: Position) => updateInner({ position: pos })}
        />
      )}
    </div>
  );
}
