import { useState, useMemo } from 'react';
import type {
  ScenarioAction,
  InfrastructureAction,
  TrafficSignalAction,
  TrafficSignalController,
} from '@osce/shared';
import { Label } from '../../ui/label';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { cn } from '@/lib/utils';
import { RefSelect } from '../RefSelect';
import type { RefSelectItem } from '../RefSelect';
import { useScenarioStore } from '../../../stores/use-scenario-store';

const EMPTY_SIGNALS: TrafficSignalController[] = [];

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
  const controllers = useScenarioStore((s) => s.document.roadNetwork.trafficSignals ?? EMPTY_SIGNALS);

  const controllerItems: RefSelectItem[] = useMemo(
    () => controllers.map((c) => ({ name: c.name, description: `${c.phases.length} phase(s)` })),
    [controllers],
  );

  const signalItems: RefSelectItem[] = useMemo(() => {
    const ids = new Set<string>();
    for (const ctrl of controllers) {
      for (const phase of ctrl.phases) {
        for (const state of phase.trafficSignalStates) {
          ids.add(state.trafficSignalId);
        }
      }
    }
    return [...ids].sort().map((id) => ({ name: id }));
  }, [controllers]);

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
          <p className="text-xs font-medium text-muted-foreground border-b border-[var(--color-glass-edge)] pb-1">
            Traffic Signal Controller Action
          </p>
          <div className="grid gap-1">
            <Label className="text-xs">Controller Ref</Label>
            <RefSelect
              value={tsa.controllerRef ?? ''}
              onValueChange={(v) => updateTsa({ controllerRef: v })}
              items={controllerItems}
              placeholder="Select controller..."
              emptyMessage="No controllers defined"
              className="h-8 text-sm"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-xs">Phase</Label>
            <ParameterAwareInput
              value={tsa.controllerAction?.phase ?? ''}
              placeholder="phase name"
              onValueChange={(v) => updateTsa({ controllerAction: { phase: v } })}
              acceptedTypes={['string']}
              className="h-8 text-sm"
            />
          </div>
        </div>
      )}

      {mode === 'state' && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground border-b border-[var(--color-glass-edge)] pb-1">
            Traffic Signal State Action
          </p>
          <div className="grid gap-1">
            <Label className="text-xs">Signal Name</Label>
            <RefSelect
              value={tsa.stateAction?.name ?? ''}
              onValueChange={(v) =>
                updateTsa({ stateAction: { name: v, state: tsa.stateAction?.state ?? '' } })
              }
              items={signalItems}
              placeholder="Select signal..."
              emptyMessage="No signals defined"
              className="h-8 text-sm"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-xs">State</Label>
            <ParameterAwareInput
              value={tsa.stateAction?.state ?? ''}
              placeholder="e.g. red, green, yellow"
              onValueChange={(v) =>
                updateTsa({ stateAction: { name: tsa.stateAction?.name ?? '', state: v } })
              }
              acceptedTypes={['string']}
              className="h-8 text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
