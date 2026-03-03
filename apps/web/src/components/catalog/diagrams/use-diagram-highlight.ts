import { useState, useCallback } from 'react';
import type { HighlightKey } from './types';

export function useDiagramHighlight() {
  const [highlighted, setHighlightedRaw] = useState<HighlightKey>(null);

  const setHighlighted = useCallback((key: HighlightKey) => {
    setHighlightedRaw(key);
  }, []);

  return { highlighted, setHighlighted };
}
