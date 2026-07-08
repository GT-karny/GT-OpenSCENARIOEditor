import { Plus, MapPin } from 'lucide-react';
import type { ScenarioAction, TrajectoryShape } from '@osce/shared';
import { Label } from '../../../../../../components/ui/label';
import { Button } from '../../../../../../components/ui/button';
import { Badge } from '../../../../../../components/ui/badge';
import { ParameterAwareInput } from '../../ParameterAwareInput';
import { SegmentedControl } from '../../SegmentedControl';
import { NurbsControlPointListItem } from '../NurbsControlPointListItem';
import { KnotVectorEditor } from '../KnotVectorEditor';
import { generateClampedUniformKnots } from '../../../../../../lib/nurbs-knot-utils';

interface NurbsSectionProps {
  nurbsShape: Extract<TrajectoryShape, { type: 'nurbs' }>;
  ownerEntityName: string | undefined;
  relativePointCount: number;
  handleRelativePointCountChange: (newCountStr: string) => void;
  action: ScenarioAction;
  updateNurbs: (updates: Partial<Extract<TrajectoryShape, { type: 'nurbs' }>>) => void;
  handleAddControlPoint: () => void;
  handleDeleteControlPoint: (index: number) => void;
  handleControlPointTimeChange: (index: number, time: number | undefined) => void;
  handleControlPointWeightChange: (index: number, weight: number | undefined) => void;
  isEditingThisTrajectory: boolean;
  handleEditIn3D: () => void;
  canEditIn3D: boolean;
}

export function NurbsSection({
  nurbsShape,
  ownerEntityName,
  relativePointCount,
  handleRelativePointCountChange,
  action,
  updateNurbs,
  handleAddControlPoint,
  handleDeleteControlPoint,
  handleControlPointTimeChange,
  handleControlPointWeightChange,
  isEditingThisTrajectory,
  handleEditIn3D,
  canEditIn3D,
}: NurbsSectionProps) {
  return (
    <div className="space-y-2">
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

      <div className="grid gap-1">
        <Label className="text-xs">Order</Label>
        <ParameterAwareInput
          elementId={action.id}
          fieldName="trajectory.shape.order"
          value={nurbsShape.order}
          onValueChange={(v) => {
            const newOrder = parseInt(v) || 3;
            const knots = nurbsShape.controlPoints.length >= 2
              ? generateClampedUniformKnots(nurbsShape.controlPoints.length, newOrder)
              : nurbsShape.knots;
            updateNurbs({ order: newOrder, knots });
          }}
          acceptedTypes={['int', 'unsignedInt']}
          className="h-8 text-sm"
        />
      </div>

      {/* Control Points */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs">
            Control Points ({nurbsShape.controlPoints.length})
          </Label>
          <button
            type="button"
            className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
            onClick={handleAddControlPoint}
            title="Add control point"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {nurbsShape.controlPoints.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2">
            No control points defined. Use &quot;Edit in 3D&quot; to add points visually.
          </p>
        ) : (
          <div className="space-y-0.5 max-h-[200px] overflow-y-auto">
            {nurbsShape.controlPoints.map((cp, i) => {
              const locked = i < relativePointCount;
              return (
                <NurbsControlPointListItem
                  key={i}
                  index={i}
                  controlPoint={cp}
                  isSelected={false}
                  onSelect={() => {}}
                  onDelete={() => handleDeleteControlPoint(i)}
                  onTimeChange={(time) => handleControlPointTimeChange(i, time)}
                  onWeightChange={(weight) => handleControlPointWeightChange(i, weight)}
                  isLocked={locked}
                  lockedLabel={locked ? (i === 0 ? `Starts at ${ownerEntityName}` : `Follows ${ownerEntityName}`) : undefined}
                />
              );
            })}
          </div>
        )}

        {nurbsShape.controlPoints.length > 0 && nurbsShape.controlPoints.length < 2 && (
          <p className="text-[10px] text-[var(--color-warning)] py-0.5">
            At least 2 control points required
          </p>
        )}
      </div>

      {/* Knot Vector */}
      <KnotVectorEditor
        knots={nurbsShape.knots}
        order={nurbsShape.order}
        controlPointCount={nurbsShape.controlPoints.length}
        onChange={(knots) => updateNurbs({ knots })}
      />

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
