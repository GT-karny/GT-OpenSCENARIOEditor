import type { ScenarioAction, RoutingAction, Position } from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { EnumSelect } from '../EnumSelect';
import { PositionEditor } from '../PositionEditor';

interface RoutingActionEditorProps {
  action: ScenarioAction;
  onUpdate: (partial: Partial<ScenarioAction>) => void;
}

export function RoutingActionEditor({ action, onUpdate }: RoutingActionEditorProps) {
  const inner = action.action as RoutingAction;

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

      {inner.routeAction === 'assignRoute' && inner.route && (
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
          <div className="grid gap-1">
            <Label className="text-xs">Waypoints (JSON)</Label>
            <textarea
              value={JSON.stringify(inner.route.waypoints, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  if (Array.isArray(parsed)) {
                    updateInner({ route: { ...inner.route!, waypoints: parsed } });
                  }
                } catch {
                  // ignore invalid JSON while typing
                }
              }}
              className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono resize-y"
              spellCheck={false}
            />
          </div>
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
