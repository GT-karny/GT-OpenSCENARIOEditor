import type { ScenarioAction, AssignControllerAction, Property } from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { SegmentedControl } from '../SegmentedControl';

type SourceMode = 'inline' | 'catalog';

interface AssignControllerActionEditorProps {
  action: ScenarioAction;
  onUpdate: (partial: Partial<ScenarioAction>) => void;
}

export function AssignControllerActionEditor({ action, onUpdate }: AssignControllerActionEditorProps) {
  const inner = action.action as AssignControllerAction;

  const sourceMode: SourceMode = inner.controller ? 'inline' : inner.catalogReference ? 'catalog' : 'inline';

  const updateInner = (updates: Partial<AssignControllerAction>) => {
    onUpdate({
      action: { ...inner, ...updates },
    } as Partial<ScenarioAction>);
  };

  const handleSourceModeChange = (mode: string) => {
    const newMode = mode as SourceMode;
    if (newMode === 'inline') {
      const { catalogReference: _, ...rest } = inner;
      onUpdate({
        action: { ...rest, controller: inner.controller ?? { name: '', properties: [] } },
      } as Partial<ScenarioAction>);
    } else {
      const { controller: _, ...rest } = inner;
      onUpdate({
        action: { ...rest, catalogReference: inner.catalogReference ?? { catalogName: '', entryName: '' } },
      } as Partial<ScenarioAction>);
    }
  };

  const addProperty = () => {
    if (!inner.controller) return;
    updateInner({
      controller: {
        ...inner.controller,
        properties: [...inner.controller.properties, { name: '', value: '' }],
      },
    });
  };

  const removeProperty = (index: number) => {
    if (!inner.controller) return;
    updateInner({
      controller: {
        ...inner.controller,
        properties: inner.controller.properties.filter((_, i) => i !== index),
      },
    });
  };

  const updateProperty = (index: number, updates: Partial<Property>) => {
    if (!inner.controller) return;
    updateInner({
      controller: {
        ...inner.controller,
        properties: inner.controller.properties.map((p, i) =>
          i === index ? { ...p, ...updates } : p,
        ),
      },
    });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Activate Flags</p>
        <div className="grid gap-2">
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={inner.activateLateral ?? false}
              onChange={(e) => updateInner({ activateLateral: e.target.checked })}
            />
            Lateral
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={inner.activateLongitudinal ?? false}
              onChange={(e) => updateInner({ activateLongitudinal: e.target.checked })}
            />
            Longitudinal
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={inner.activateAnimation ?? false}
              onChange={(e) => updateInner({ activateAnimation: e.target.checked })}
            />
            Animation
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={inner.activateLighting ?? false}
              onChange={(e) => updateInner({ activateLighting: e.target.checked })}
            />
            Lighting
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Controller Source</p>
        <div className="grid gap-1">
          <Label className="text-xs">Source</Label>
          <SegmentedControl
            value={sourceMode}
            options={['inline', 'catalog'] as const}
            onValueChange={handleSourceModeChange}
            labels={{ inline: 'Inline', catalog: 'Catalog' }}
          />
        </div>

        {sourceMode === 'inline' && inner.controller && (
          <div className="space-y-2">
            <div className="grid gap-1">
              <Label className="text-xs">Controller Name</Label>
              <Input
                value={inner.controller.name}
                onChange={(e) =>
                  updateInner({ controller: { ...inner.controller!, name: e.target.value } })
                }
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Properties</Label>
                <button
                  type="button"
                  onClick={addProperty}
                  className="text-xs text-primary hover:underline"
                >
                  + Add
                </button>
              </div>
              {inner.controller.properties.map((prop, i) => (
                <div key={i} className="flex gap-1 items-center">
                  <Input
                    value={prop.name}
                    placeholder="name"
                    onChange={(e) => updateProperty(i, { name: e.target.value })}
                    className="h-7 text-xs flex-1"
                  />
                  <ParameterAwareInput
                    value={prop.value}
                    placeholder="value"
                    onValueChange={(v) => updateProperty(i, { value: v })}
                    acceptedTypes={['string']}
                    className="h-7 text-xs flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeProperty(i)}
                    className="text-xs text-destructive hover:underline px-1"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {sourceMode === 'catalog' && inner.catalogReference && (
          <div className="space-y-2">
            <div className="grid gap-1">
              <Label className="text-xs">Catalog Name</Label>
              <Input
                value={inner.catalogReference.catalogName}
                onChange={(e) =>
                  updateInner({
                    catalogReference: { ...inner.catalogReference!, catalogName: e.target.value },
                  })
                }
                className="h-8 text-sm"
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Entry Name</Label>
              <Input
                value={inner.catalogReference.entryName}
                onChange={(e) =>
                  updateInner({
                    catalogReference: { ...inner.catalogReference!, entryName: e.target.value },
                  })
                }
                className="h-8 text-sm"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
