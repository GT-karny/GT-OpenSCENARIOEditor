import type { ScenarioAction, TransitionDynamics, Position } from '@osce/shared';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { EnumSelect } from './EnumSelect';
import { PositionEditor } from './PositionEditor';
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

  const handlePositionChange = (fieldName: string, newPosition: Position) => {
    const updatedAction = { ...action.action, [fieldName]: newPosition };
    storeApi.getState().updateAction(action.id, { action: updatedAction } as Partial<ScenarioAction>);
  };

  const actionType = action.action.type;
  const hasDynamics =
    actionType === 'speedAction' || actionType === 'laneChangeAction';

  const positionFields = getActionPositionFields(action.action);

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

      {positionFields.map(({ fieldName, label, position }) => (
        <div key={fieldName} className="space-y-1">
          {label && <p className="text-xs font-medium text-muted-foreground">{label}</p>}
          <PositionEditor
            position={position}
            onChange={(p) => handlePositionChange(fieldName, p)}
          />
        </div>
      ))}
    </div>
  );
}

interface ActionPositionField {
  fieldName: string;
  label: string | null;
  position: Position;
}

function getActionPositionFields(innerAction: ScenarioAction['action']): ActionPositionField[] {
  const fields: ActionPositionField[] = [];
  const a = innerAction as Record<string, unknown>;

  switch (innerAction.type) {
    case 'teleportAction':
    case 'acquirePositionAction':
      if (a.position && typeof a.position === 'object' && 'type' in (a.position as object)) {
        fields.push({ fieldName: 'position', label: null, position: a.position as Position });
      }
      break;
    case 'synchronizeAction':
      if (a.targetPositionMaster && typeof a.targetPositionMaster === 'object' && 'type' in (a.targetPositionMaster as object)) {
        fields.push({ fieldName: 'targetPositionMaster', label: 'Master Position', position: a.targetPositionMaster as Position });
      }
      if (a.targetPosition && typeof a.targetPosition === 'object' && 'type' in (a.targetPosition as object)) {
        fields.push({ fieldName: 'targetPosition', label: 'Target Position', position: a.targetPosition as Position });
      }
      break;
    case 'routingAction':
      if (a.position && typeof a.position === 'object' && 'type' in (a.position as object)) {
        fields.push({ fieldName: 'position', label: null, position: a.position as Position });
      }
      break;
  }

  return fields;
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
