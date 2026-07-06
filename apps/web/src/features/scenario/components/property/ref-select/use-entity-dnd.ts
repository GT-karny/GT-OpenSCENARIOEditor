import { useCallback, useState } from 'react';
import { ENTITY_DND_TYPE } from '../../entity/EntityListItem';
import { PARAMETER_DND_TYPE } from '../../parameter/ParameterListItem';
import { VARIABLE_DND_TYPE } from '../../variable/VariableListItem';

interface EntityDndOptions {
  /** Receives a parameter/variable ref already prefixed with `$`. */
  onDropRef: (ref: string) => void;
  /** Receives a dropped entity name. */
  onDropEntity: (name: string) => void;
}

/**
 * Drag-and-drop wiring shared by the entity selectors: accepts entity,
 * parameter, and variable payloads and tracks the drag-over highlight.
 */
export function useEntityDnd({ onDropRef, onDropEntity }: EntityDndOptions) {
  const [isDragOver, setIsDragOver] = useState(false);

  const onDragOver = useCallback((e: React.DragEvent) => {
    if (
      e.dataTransfer.types.includes(PARAMETER_DND_TYPE) ||
      e.dataTransfer.types.includes(VARIABLE_DND_TYPE) ||
      e.dataTransfer.types.includes(ENTITY_DND_TYPE)
    ) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setIsDragOver(true);
    }
  }, []);

  const onDragLeave = useCallback(() => setIsDragOver(false), []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const paramName =
        e.dataTransfer.getData(PARAMETER_DND_TYPE) || e.dataTransfer.getData(VARIABLE_DND_TYPE);
      if (paramName) {
        onDropRef(`$${paramName}`);
        return;
      }
      const entityName = e.dataTransfer.getData(ENTITY_DND_TYPE);
      if (entityName) onDropEntity(entityName);
    },
    [onDropRef, onDropEntity],
  );

  return { isDragOver, dndHandlers: { onDragOver, onDragLeave, onDrop } };
}
