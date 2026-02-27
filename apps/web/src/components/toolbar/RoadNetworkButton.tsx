import { Map } from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { useFileOperations } from '../../hooks/use-file-operations';
import { useEditorStore } from '../../stores/editor-store';

export function RoadNetworkButton() {
  const { loadXodr } = useFileOperations();
  const hasRoadNetwork = useEditorStore((s) => s.roadNetwork !== null);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={hasRoadNetwork ? 'secondary' : 'ghost'}
          size="sm"
          className="text-xs gap-1"
          onClick={loadXodr}
        >
          <Map className="h-4 w-4" />
          .xodr
        </Button>
      </TooltipTrigger>
      <TooltipContent>Load OpenDRIVE road network</TooltipContent>
    </Tooltip>
  );
}
