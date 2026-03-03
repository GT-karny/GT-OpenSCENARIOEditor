import type { VehicleDefinition } from '@osce/shared';
import type { HighlightKey } from './types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/tabs';
import { VehicleSideView } from './VehicleSideView';
import { VehicleTopView } from './VehicleTopView';

interface VehicleDiagramPanelProps {
  definition: VehicleDefinition;
  highlighted: HighlightKey;
  onHighlight: (key: HighlightKey) => void;
}

export function VehicleDiagramPanel({
  definition,
  highlighted,
  onHighlight,
}: VehicleDiagramPanelProps) {
  return (
    <Tabs defaultValue="side" className="flex flex-col h-full w-full">
      <TabsList className="shrink-0 h-7 bg-transparent border-b border-[var(--color-border-glass)] rounded-none px-2 gap-1">
        <TabsTrigger
          value="side"
          className="h-5 px-2 text-[9px] font-display tracking-widest uppercase rounded-none data-[state=active]:bg-[var(--color-glass-2)] data-[state=active]:text-[var(--color-text-primary)] text-[var(--color-text-muted)]"
        >
          Side
        </TabsTrigger>
        <TabsTrigger
          value="top"
          className="h-5 px-2 text-[9px] font-display tracking-widest uppercase rounded-none data-[state=active]:bg-[var(--color-glass-2)] data-[state=active]:text-[var(--color-text-primary)] text-[var(--color-text-muted)]"
        >
          Top
        </TabsTrigger>
      </TabsList>

      <TabsContent value="side" className="flex-1 mt-0 min-h-0">
        <VehicleSideView
          boundingBox={definition.boundingBox}
          axles={definition.axles}
          highlighted={highlighted}
          onHighlight={onHighlight}
        />
      </TabsContent>

      <TabsContent value="top" className="flex-1 mt-0 min-h-0">
        <VehicleTopView
          boundingBox={definition.boundingBox}
          axles={definition.axles}
          highlighted={highlighted}
          onHighlight={onHighlight}
        />
      </TabsContent>
    </Tabs>
  );
}
