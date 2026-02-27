/**
 * Hook for entity interaction event handlers.
 * Returns onClick and onDoubleClick handlers for use in R3F mesh components.
 */

import { useCallback } from 'react';

interface EntityInteractionHandlers {
  onClick: () => void;
  onDoubleClick: () => void;
}

/**
 * Creates interaction handlers for an entity in the 3D scene.
 *
 * @param entityId - The entity's unique ID
 * @param onSelect - Called when entity is clicked (single click)
 * @param onFocus - Called when entity is double-clicked (camera focus)
 */
export function useEntityInteraction(
  entityId: string,
  onSelect: (entityId: string) => void,
  onFocus?: (entityId: string) => void,
): EntityInteractionHandlers {
  const onClick = useCallback(() => {
    onSelect(entityId);
  }, [entityId, onSelect]);

  const onDoubleClick = useCallback(() => {
    onFocus?.(entityId);
  }, [entityId, onFocus]);

  return { onClick, onDoubleClick };
}
