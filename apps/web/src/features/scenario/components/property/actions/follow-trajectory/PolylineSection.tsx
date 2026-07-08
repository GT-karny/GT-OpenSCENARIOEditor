import { Plus, MapPin } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type { ScenarioAction, TrajectoryShape, Orientation } from '@osce/shared';
import { Label } from '../../../../../../components/ui/label';
import { Button } from '../../../../../../components/ui/button';
import { Badge } from '../../../../../../components/ui/badge';
import { SegmentedControl } from '../../SegmentedControl';
import { TrajectoryVertexListItem } from '../TrajectoryVertexListItem';

interface PolylineSectionProps {
  ownerEntityName: string | undefined;
  relativePointCount: number;
  handleRelativePointCountChange: (newCountStr: string) => void;
  polylineShape: Extract<TrajectoryShape, { type: 'polyline' }>;
  handleAddVertex: () => void;
  expandedVertexIndex: number | null;
  setExpandedVertexIndex: Dispatch<SetStateAction<number | null>>;
  handleDeleteVertex: (index: number) => void;
  handleVertexTimeChange: (index: number, time: number | undefined) => void;
  handleVertexOrientationChange: (index: number, orientation: Orientation | undefined) => void;
  action: ScenarioAction;
  isEditingThisTrajectory: boolean;
  handleEditIn3D: () => void;
  canEditIn3D: boolean;
}

export function PolylineSection({
  ownerEntityName,
  relativePointCount,
  handleRelativePointCountChange,
  polylineShape,
  handleAddVertex,
  expandedVertexIndex,
  setExpandedVertexIndex,
  handleDeleteVertex,
  handleVertexTimeChange,
  handleVertexOrientationChange,
  action,
  isEditingThisTrajectory,
  handleEditIn3D,
  canEditIn3D,
}: PolylineSectionProps) {
  return (
    <div className="space-y-1">
      {ownerEntityName && (
        <div className="grid gap-1">
          <Label className="text-xs">Start from entity</Label>
          <SegmentedControl
            value={String(relativePointCount) as '0' | '1' | '2'}
            options={['0', '1', '2'] as const}
            onValueChange={handleRelativePointCountChange}
            labels={{ '0': 'Off', '1': '1 pt', '2': '2 pts' }}
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <Label className="text-xs">
          Vertices ({polylineShape.vertices.length})
        </Label>
        <button
          type="button"
          className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
          onClick={handleAddVertex}
          title="Add vertex"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {polylineShape.vertices.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-2">
          No vertices defined. Use &quot;Edit in 3D&quot; to add vertices visually.
        </p>
      ) : (
        <div className="space-y-0.5 max-h-[200px] overflow-y-auto">
          {polylineShape.vertices.map((vertex, i) => {
            const locked = i < relativePointCount;
            return (
              <TrajectoryVertexListItem
                key={i}
                index={i}
                vertex={vertex}
                isSelected={expandedVertexIndex === i}
                onSelect={() => setExpandedVertexIndex(expandedVertexIndex === i ? null : i)}
                onDelete={() => handleDeleteVertex(i)}
                onTimeChange={(time) => handleVertexTimeChange(i, time)}
                expanded={expandedVertexIndex === i}
                onOrientationChange={(ori) => handleVertexOrientationChange(i, ori)}
                elementId={action.id}
                isLocked={locked}
                lockedLabel={locked ? (i === 0 ? `Starts at ${ownerEntityName}` : `Follows ${ownerEntityName}`) : undefined}
              />
            );
          })}
        </div>
      )}

      {polylineShape.vertices.length > 0 && polylineShape.vertices.length < 2 && (
        <p className="text-[10px] text-[var(--color-warning)] py-0.5">
          At least 2 vertices required for a valid polyline
        </p>
      )}

      {/* Edit in 3D / Editing badge */}
      {isEditingThisTrajectory ? (
        <Badge variant="secondary" className="w-full justify-center py-1.5 text-xs">
          <MapPin className="mr-1.5 h-3 w-3" />
          Editing in 3D...
        </Badge>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleEditIn3D}
          disabled={!canEditIn3D}
        >
          <MapPin className="mr-1.5 h-3.5 w-3.5" />
          Edit in 3D
        </Button>
      )}
    </div>
  );
}
