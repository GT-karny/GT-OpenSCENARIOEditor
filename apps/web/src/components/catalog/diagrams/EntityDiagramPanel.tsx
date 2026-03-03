import type {
  VehicleDefinition,
  PedestrianDefinition,
  MiscObjectDefinition,
} from '@osce/shared';
import type { HighlightKey } from './types';
import { VehicleDiagramPanel } from './VehicleDiagramPanel';
import { BoundingBoxDiagram } from './BoundingBoxDiagram';

interface EntityDiagramPanelProps {
  definition: VehicleDefinition | PedestrianDefinition | MiscObjectDefinition;
  highlighted: HighlightKey;
  onHighlight: (key: HighlightKey) => void;
}

export function EntityDiagramPanel({
  definition,
  highlighted,
  onHighlight,
}: EntityDiagramPanelProps) {
  if (definition.kind === 'vehicle') {
    return (
      <VehicleDiagramPanel
        definition={definition}
        highlighted={highlighted}
        onHighlight={onHighlight}
      />
    );
  }

  return (
    <BoundingBoxDiagram
      boundingBox={definition.boundingBox}
      highlighted={highlighted}
      onHighlight={onHighlight}
    />
  );
}
