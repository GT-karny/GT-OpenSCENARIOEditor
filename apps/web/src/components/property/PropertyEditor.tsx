import { detectElementType } from './ElementTypeDetector';
import { EntityPropertyEditor } from './EntityPropertyEditor';
import { ActionPropertyEditor } from './ActionPropertyEditor';
import { EventPropertyEditor } from './EventPropertyEditor';
import { ConditionPropertyEditor } from './ConditionPropertyEditor';
import { ActPropertyEditor } from './ActPropertyEditor';
import { ManeuverGroupPropertyEditor } from './ManeuverGroupPropertyEditor';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';

interface PropertyEditorProps {
  element: unknown;
  elementId: string;
}

export function PropertyEditor({ element }: PropertyEditorProps) {
  const storeApi = useScenarioStoreApi();
  const detected = detectElementType(element);

  switch (detected.kind) {
    case 'entity':
      return <EntityPropertyEditor entity={detected.element} />;

    case 'event':
      return <EventPropertyEditor event={detected.element} />;

    case 'action':
      return (
        <ActionPropertyEditor
          action={detected.element}
          onUpdate={(actionId, partial) =>
            storeApi.getState().updateAction(actionId, partial)
          }
        />
      );

    case 'maneuverGroup':
      return <ManeuverGroupPropertyEditor group={detected.element} />;

    case 'story':
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium">Story: {detected.element.name}</p>
          <p className="text-xs text-muted-foreground">
            Acts: {detected.element.acts.length}
          </p>
        </div>
      );

    case 'act':
      return <ActPropertyEditor act={detected.element} />;

    case 'trigger':
      return (
        <ConditionPropertyEditor
          trigger={detected.element}
          onUpdateCondition={(conditionId, partial) =>
            storeApi.getState().updateCondition(conditionId, partial)
          }
        />
      );

    default:
      return (
        <div className="text-sm text-muted-foreground">
          <p>Unknown element type</p>
          <pre className="mt-2 text-xs overflow-auto max-h-64">
            {JSON.stringify(element, null, 2)}
          </pre>
        </div>
      );
  }
}
