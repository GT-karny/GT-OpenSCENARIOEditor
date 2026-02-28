import { detectElementType } from './ElementTypeDetector';
import { EntityPropertyEditor } from './EntityPropertyEditor';
import { ActionPropertyEditor } from './ActionPropertyEditor';
import { EventPropertyEditor } from './EventPropertyEditor';
import { ConditionPropertyEditor } from './ConditionPropertyEditor';

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
      return <EventPropertyEditor event={detected.element} />;

    case 'action':
      return <ActionPropertyEditor action={detected.element} />;

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
      return <ConditionPropertyEditor trigger={detected.element} />;

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
