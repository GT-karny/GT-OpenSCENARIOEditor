import { MapPin } from 'lucide-react';
import type { ScenarioAction, Trajectory, TrajectoryShape, Position } from '@osce/shared';
import { Label } from '../../../../../../components/ui/label';
import { Button } from '../../../../../../components/ui/button';
import { Badge } from '../../../../../../components/ui/badge';
import { ParameterAwareInput } from '../../ParameterAwareInput';
import { PositionEditor } from '../../PositionEditor';

interface ClothoidSectionProps {
  clothoidShape: Extract<TrajectoryShape, { type: 'clothoid' }>;
  action: ScenarioAction;
  updateClothoid: (updates: Partial<Extract<TrajectoryShape, { type: 'clothoid' }>>) => void;
  updateTrajectory: (updates: Partial<Trajectory>) => void;
  DEFAULT_WORLD_POSITION: Position;
  isEditingThisTrajectory: boolean;
  handleEditIn3D: () => void;
  canEditIn3D: boolean;
}

export function ClothoidSection({
  clothoidShape,
  action,
  updateClothoid,
  updateTrajectory,
  DEFAULT_WORLD_POSITION,
  isEditingThisTrajectory,
  handleEditIn3D,
  canEditIn3D,
}: ClothoidSectionProps) {
  return (
    <div className="space-y-2">
      <div className="grid gap-1">
        <Label className="text-xs">Curvature</Label>
        <ParameterAwareInput
          elementId={action.id}
          fieldName="trajectory.shape.curvature"
          value={clothoidShape.curvature}
          onValueChange={(v) => updateClothoid({ curvature: parseFloat(v) || 0 })}
          acceptedTypes={['double']}
          className="h-8 text-sm"
        />
      </div>
      <div className="grid gap-1">
        <Label className="text-xs">Curvature Dot</Label>
        <ParameterAwareInput
          elementId={action.id}
          fieldName="trajectory.shape.curvatureDot"
          value={clothoidShape.curvatureDot}
          onValueChange={(v) => updateClothoid({ curvatureDot: parseFloat(v) || 0 })}
          acceptedTypes={['double']}
          className="h-8 text-sm"
        />
      </div>
      <div className="grid gap-1">
        <Label className="text-xs">Length (m)</Label>
        <ParameterAwareInput
          elementId={action.id}
          fieldName="trajectory.shape.length"
          value={clothoidShape.length}
          onValueChange={(v) => updateClothoid({ length: parseFloat(v) || 0 })}
          acceptedTypes={['double']}
          className="h-8 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1">
          <Label className="text-xs">Start Time (s)</Label>
          <ParameterAwareInput
            elementId={action.id}
            fieldName="trajectory.shape.startTime"
            value={clothoidShape.startTime ?? ''}
            placeholder="--"
            onValueChange={(v) => {
              if (v === '') {
                const { startTime: _, ...rest } = clothoidShape;
                updateTrajectory({ shape: { ...rest, type: 'clothoid' } as TrajectoryShape });
              } else {
                updateClothoid({ startTime: parseFloat(v) || 0 });
              }
            }}
            acceptedTypes={['double']}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Stop Time (s)</Label>
          <ParameterAwareInput
            elementId={action.id}
            fieldName="trajectory.shape.stopTime"
            value={clothoidShape.stopTime ?? ''}
            placeholder="--"
            onValueChange={(v) => {
              if (v === '') {
                const { stopTime: _, ...rest } = clothoidShape;
                updateTrajectory({ shape: { ...rest, type: 'clothoid' } as TrajectoryShape });
              } else {
                updateClothoid({ stopTime: parseFloat(v) || 0 });
              }
            }}
            acceptedTypes={['double']}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Origin Position */}
      <div className="space-y-1">
        <Label className="text-xs">Origin Position</Label>
        <PositionEditor
          position={clothoidShape.position ?? DEFAULT_WORLD_POSITION}
          onChange={(pos: Position) => updateClothoid({ position: pos })}
          elementId={action.id}
          fieldPathPrefix="action.trajectory.shape.position"
        />
      </div>

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
