import type { ScenarioAction, TransitionDynamics } from '@osce/shared';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { EnumSelect } from './EnumSelect';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';
import { DYNAMICS_SHAPES } from '../../constants/osc-enum-values';

interface ActionPropertyEditorProps {
  action: ScenarioAction;
}

export function ActionPropertyEditor({ action }: ActionPropertyEditorProps) {
  const storeApi = useScenarioStoreApi();

  const handleDynamicsShapeChange = (dynamics: TransitionDynamics, value: string) => {
    const updatedAction = {
      ...action.action,
      dynamics: { ...dynamics, dynamicsShape: value },
    };
    storeApi.getState().updateAction(action.id, { action: updatedAction } as Partial<ScenarioAction>);
  };

  const actionType = action.action.type;
  const hasDynamics =
    actionType === 'speedAction' || actionType === 'laneChangeAction';

  return (
    <div className="space-y-4">
      <div className="pb-2 border-b">
        <p className="text-sm font-medium">{action.name}</p>
        <p className="text-xs text-muted-foreground">{actionType}</p>
      </div>

      <div className="grid gap-2">
        <Label className="text-xs">Name</Label>
        <Input value={action.name} readOnly className="h-8 text-sm bg-muted" />
      </div>

      <div className="grid gap-2">
        <Label className="text-xs">Type</Label>
        <Input value={actionType} readOnly className="h-8 text-sm bg-muted" />
      </div>

      {hasDynamics && 'dynamics' in action.action && (
        <DynamicsEditor
          dynamics={(action.action as { dynamics: TransitionDynamics }).dynamics}
          onDynamicsShapeChange={(value) =>
            handleDynamicsShapeChange(
              (action.action as { dynamics: TransitionDynamics }).dynamics,
              value,
            )
          }
        />
      )}
    </div>
  );
}

interface DynamicsEditorProps {
  dynamics: TransitionDynamics;
  onDynamicsShapeChange: (value: string) => void;
}

function DynamicsEditor({ dynamics, onDynamicsShapeChange }: DynamicsEditorProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Dynamics</p>
      <div className="grid gap-1">
        <Label className="text-xs">Shape</Label>
        <EnumSelect
          value={dynamics.dynamicsShape}
          options={DYNAMICS_SHAPES}
          onValueChange={onDynamicsShapeChange}
          className="h-8 text-sm"
        />
      </div>
    </div>
  );
}
