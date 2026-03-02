import type { ScenarioAction, Position } from '@osce/shared';
import { Label } from '../../ui/label';
import { PositionEditor } from '../PositionEditor';
import { useScenarioStoreApi } from '../../../stores/use-scenario-store';

interface TeleportActionEditorProps {
  action: ScenarioAction;
}

interface PositionField {
  fieldName: string;
  label: string | null;
}

function getPositionFields(action: ScenarioAction['action']): PositionField[] {
  switch (action.type) {
    case 'teleportAction':
    case 'acquirePositionAction':
      return [{ fieldName: 'position', label: null }];
    case 'synchronizeAction':
      return [
        { fieldName: 'targetPositionMaster', label: 'Master Position' },
        { fieldName: 'targetPosition', label: 'Target Position' },
      ];
    case 'routingAction':
      return [{ fieldName: 'position', label: null }];
    default:
      return [];
  }
}

export function TeleportActionEditor({ action }: TeleportActionEditorProps) {
  const storeApi = useScenarioStoreApi();
  const inner = action.action as Record<string, unknown>;
  const fields = getPositionFields(action.action);

  const handlePositionChange = (fieldName: string, newPosition: Position) => {
    storeApi.getState().updateAction(action.id, {
      action: { ...inner, [fieldName]: newPosition },
    } as Partial<ScenarioAction>);
  };

  return (
    <div className="space-y-3">
      {fields.map(({ fieldName, label }) => {
        const pos = inner[fieldName];
        if (!pos || typeof pos !== 'object' || !('type' in (pos as object))) return null;
        return (
          <div key={fieldName} className="space-y-1">
            {label && <Label className="text-xs font-medium text-muted-foreground">{label}</Label>}
            <PositionEditor
              position={pos as Position}
              onChange={(p) => handlePositionChange(fieldName, p)}
            />
          </div>
        );
      })}
    </div>
  );
}
