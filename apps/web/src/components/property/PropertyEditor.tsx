import { detectElementType } from './ElementTypeDetector';
import { EntityPropertyEditor } from './EntityPropertyEditor';

interface PropertyEditorProps {
  element: unknown;
  elementId: string;
}

export function PropertyEditor({ element }: PropertyEditorProps) {
  const detected = detectElementType(element);

  switch (detected.kind) {
    case 'entity':
      return <EntityPropertyEditor entity={detected.element} />;

    case 'event':
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium">Event: {detected.element.name}</p>
          <p className="text-xs text-muted-foreground">
            Priority: {detected.element.priority}
          </p>
          <p className="text-xs text-muted-foreground">
            Actions: {detected.element.actions.length}
          </p>
        </div>
      );

    case 'action':
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium">Action: {detected.element.name}</p>
          <p className="text-xs text-muted-foreground">
            Type: {'type' in detected.element.action ? String(detected.element.action.type) : 'unknown'}
          </p>
        </div>
      );

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
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium">Act: {detected.element.name}</p>
          <p className="text-xs text-muted-foreground">
            Maneuver Groups: {detected.element.maneuverGroups.length}
          </p>
        </div>
      );

    case 'trigger':
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium">Trigger</p>
          <p className="text-xs text-muted-foreground">
            Condition Groups: {detected.element.conditionGroups.length}
          </p>
        </div>
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
