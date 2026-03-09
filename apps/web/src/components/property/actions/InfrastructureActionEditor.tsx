import { useState } from 'react';
import type { ScenarioAction, InfrastructureAction, TrafficSignalAction } from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { cn } from '@/lib/utils';

interface InfrastructureActionEditorProps {
  action: ScenarioAction;
  onUpdate: (partial: Partial<ScenarioAction>) => void;
}

type SignalActionMode = 'controller' | 'state';

function detectMode(tsa: TrafficSignalAction): SignalActionMode {
  if (tsa.stateAction) return 'state';
  return 'controller';
}

export function InfrastructureActionEditor({
  action,
  onUpdate,
}: InfrastructureActionEditorProps) {
  const inner = action.action as InfrastructureAction;
  const tsa = inner.trafficSignalAction ?? {};

  const [mode, setMode] = useState<SignalActionMode>(() => detectMode(tsa));

  const updateTsa = (updates: Partial<TrafficSignalAction>) => {
    onUpdate({
      action: { ...inner, trafficSignalAction: { ...tsa, ...updates } },
    } as Partial<ScenarioAction>);
  };

  const handleModeChange = (newMode: SignalActionMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    if (newMode === 'controller') {
      onUpdate({
        action: {
          ...inner,
          trafficSignalAction: {
            controllerRef: tsa.controllerRef ?? '',
            controllerAction: tsa.controllerAction ?? { phase: '' },
          },
        },
      } as Partial<ScenarioAction>);
    } else {
      onUpdate({
        action: {
          ...inner,
          trafficSignalAction: {
            stateAction: tsa.stateAction ?? { name: '', state: '' },
          },
        },
      } as Partial<ScenarioAction>);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="grid gap-1.5">
        <Label className="text-xs">Signal Action Type</Label>
        <div className="flex gap-0.5 p-0.5 bg-muted">
          {(['controller', 'state'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleModeChange(m)}
              className={cn(
                'flex-1 px-2 py-1.5 text-xs font-medium transition-all',
                mode === m
                  ? 'glass-item selected'
                  : 'text-muted-foreground hover:text-foreground hover:bg-[var(--color-glass-hover)]',
              )}
            >
              {m === 'controller' ? 'Controller' : 'Signal State'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'controller' && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground border-b pb-1">
            Traffic Signal Controller Action
          </p>
          <div className="grid gap-1">
            <Label className="text-xs">Controller Ref</Label>
            <Input
              value={tsa.controllerRef ?? ''}
              placeholder="controller name"
              onChange={(e) => updateTsa({ controllerRef: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-xs">Phase</Label>
            <Input
              value={tsa.controllerAction?.phase ?? ''}
              placeholder="phase name"
              onChange={(e) => updateTsa({ controllerAction: { phase: e.target.value } })}
              className="h-8 text-sm"
            />
          </div>
        </div>
      )}

      {mode === 'state' && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground border-b pb-1">
            Traffic Signal State Action
          </p>
          <div className="grid gap-1">
            <Label className="text-xs">Signal Name</Label>
            <Input
              value={tsa.stateAction?.name ?? ''}
              placeholder="signal name"
              onChange={(e) =>
                updateTsa({ stateAction: { name: e.target.value, state: tsa.stateAction?.state ?? '' } })
              }
              className="h-8 text-sm"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-xs">State</Label>
            <Input
              value={tsa.stateAction?.state ?? ''}
              placeholder="e.g. red, green, yellow"
              onChange={(e) =>
                updateTsa({ stateAction: { name: tsa.stateAction?.name ?? '', state: e.target.value } })
              }
              className="h-8 text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
