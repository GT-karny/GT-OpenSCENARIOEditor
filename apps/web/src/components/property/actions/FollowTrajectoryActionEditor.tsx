import type {
  ScenarioAction,
  FollowTrajectoryAction,
  Trajectory,
  TrajectoryShape,
  TrajectoryVertex,
  NurbsControlPoint,
  TimeReference,
  Position,
} from '@osce/shared';
import type { FollowingMode } from '@osce/shared';
import { MapPin, Plus } from 'lucide-react';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { SegmentedControl } from '../SegmentedControl';
import { OptionalFieldWrapper } from '../OptionalFieldWrapper';
import { PositionEditor } from '../PositionEditor';
import { TrajectoryVertexListItem } from './TrajectoryVertexListItem';
import { NurbsControlPointListItem } from './NurbsControlPointListItem';
import { KnotVectorEditor } from './KnotVectorEditor';
import { useTrajectoryEditStore } from '../../../stores/trajectory-edit-store';
import { useRouteEditStore } from '../../../stores/route-edit-store';

interface FollowTrajectoryActionEditorProps {
  action: ScenarioAction;
  onUpdate: (partial: Partial<ScenarioAction>) => void;
}

const DEFAULT_WORLD_POSITION: Position = { type: 'worldPosition', x: 0, y: 0 };

export function FollowTrajectoryActionEditor({
  action,
  onUpdate,
}: FollowTrajectoryActionEditorProps) {
  const inner = action.action as FollowTrajectoryAction;

  // Trajectory edit mode state
  const trajectoryEditActive = useTrajectoryEditStore((s) => s.active);
  const trajectoryEditSource = useTrajectoryEditStore((s) => s.source);
  const routeEditActive = useRouteEditStore((s) => s.active);

  const isEditingThisTrajectory =
    trajectoryEditActive &&
    trajectoryEditSource?.type === 'action' &&
    trajectoryEditSource.actionId === action.id;

  const canEditIn3D = !trajectoryEditActive && !routeEditActive;

  const handleEditIn3D = () => {
    if (!canEditIn3D) return;
    useTrajectoryEditStore.getState().enterTrajectoryEditMode(
      { type: 'action', actionId: action.id },
      inner.trajectory,
    );
  };

  const updateInner = (updates: Partial<FollowTrajectoryAction>) => {
    onUpdate({
      action: { ...inner, ...updates },
    } as Partial<ScenarioAction>);
  };

  const timeRefMode: 'none' | 'timing' = inner.timeReference.timing ? 'timing' : 'none';
  const shapeType = inner.trajectory.shape.type;

  const handleTimeRefChange = (mode: string) => {
    if (mode === 'none') {
      updateInner({ timeReference: { none: true } });
    } else {
      updateInner({
        timeReference: {
          timing: {
            domainAbsoluteRelative: 'absolute',
            offset: 0,
            scale: 1,
          },
        },
      });
    }
  };

  const updateTiming = (updates: Partial<NonNullable<TimeReference['timing']>>) => {
    if (!inner.timeReference.timing) return;
    updateInner({
      timeReference: {
        timing: { ...inner.timeReference.timing, ...updates },
      },
    });
  };

  const updateTrajectory = (updates: Partial<Trajectory>) => {
    updateInner({ trajectory: { ...inner.trajectory, ...updates } });
  };

  const handleShapeTypeChange = (newType: string) => {
    let shape: TrajectoryShape;
    switch (newType) {
      case 'polyline':
        shape = { type: 'polyline', vertices: [] };
        break;
      case 'clothoid':
        shape = {
          type: 'clothoid',
          curvature: 0,
          curvatureDot: 0,
          length: 0,
          position: { ...DEFAULT_WORLD_POSITION },
        };
        break;
      case 'nurbs':
        shape = { type: 'nurbs', order: 3, controlPoints: [], knots: [] };
        break;
      default:
        return;
    }
    updateTrajectory({ shape });
  };

  // --- Polyline helpers ---
  const polylineShape = shapeType === 'polyline'
    ? (inner.trajectory.shape as Extract<TrajectoryShape, { type: 'polyline' }>)
    : null;

  const updatePolylineVertices = (vertices: TrajectoryVertex[]) => {
    updateTrajectory({ shape: { type: 'polyline', vertices } });
  };

  const handleAddVertex = () => {
    if (!polylineShape) return;
    const newVertex: TrajectoryVertex = { position: { ...DEFAULT_WORLD_POSITION } };
    updatePolylineVertices([...polylineShape.vertices, newVertex]);
  };

  const handleDeleteVertex = (index: number) => {
    if (!polylineShape) return;
    updatePolylineVertices(polylineShape.vertices.filter((_, i) => i !== index));
  };

  const handleVertexTimeChange = (index: number, time: number | undefined) => {
    if (!polylineShape) return;
    updatePolylineVertices(
      polylineShape.vertices.map((v, i) => (i === index ? { ...v, time } : v)),
    );
  };

  // --- Clothoid helpers ---
  const clothoidShape = shapeType === 'clothoid'
    ? (inner.trajectory.shape as Extract<TrajectoryShape, { type: 'clothoid' }>)
    : null;

  const updateClothoid = (updates: Partial<Extract<TrajectoryShape, { type: 'clothoid' }>>) => {
    if (!clothoidShape) return;
    updateTrajectory({ shape: { ...clothoidShape, ...updates } });
  };

  // --- NURBS helpers ---
  const nurbsShape = shapeType === 'nurbs'
    ? (inner.trajectory.shape as Extract<TrajectoryShape, { type: 'nurbs' }>)
    : null;

  const updateNurbs = (updates: Partial<Extract<TrajectoryShape, { type: 'nurbs' }>>) => {
    if (!nurbsShape) return;
    updateTrajectory({ shape: { ...nurbsShape, ...updates } });
  };

  const handleAddControlPoint = () => {
    if (!nurbsShape) return;
    const newCp: NurbsControlPoint = { position: { ...DEFAULT_WORLD_POSITION }, weight: 1.0 };
    updateNurbs({ controlPoints: [...nurbsShape.controlPoints, newCp] });
  };

  const handleDeleteControlPoint = (index: number) => {
    if (!nurbsShape) return;
    updateNurbs({ controlPoints: nurbsShape.controlPoints.filter((_, i) => i !== index) });
  };

  const handleControlPointTimeChange = (index: number, time: number | undefined) => {
    if (!nurbsShape) return;
    updateNurbs({
      controlPoints: nurbsShape.controlPoints.map((cp, i) =>
        i === index ? { ...cp, time } : cp,
      ),
    });
  };

  const handleControlPointWeightChange = (index: number, weight: number | undefined) => {
    if (!nurbsShape) return;
    updateNurbs({
      controlPoints: nurbsShape.controlPoints.map((cp, i) =>
        i === index ? { ...cp, weight } : cp,
      ),
    });
  };

  return (
    <div className="space-y-3">
      {/* Following Mode */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Following Mode</p>
        <SegmentedControl
          value={inner.followingMode}
          options={['position', 'follow'] as const}
          onValueChange={(v) => updateInner({ followingMode: v as FollowingMode })}
          labels={{ position: 'Position', follow: 'Follow' }}
        />
      </div>

      {/* Initial Distance Offset */}
      <OptionalFieldWrapper
        label="Initial Distance Offset (m)"
        hasValue={inner.initialDistanceOffset !== undefined}
        onClear={() => {
          const { initialDistanceOffset: _, ...rest } = inner;
          onUpdate({ action: { ...rest } } as Partial<ScenarioAction>);
        }}
      >
        <ParameterAwareInput
          elementId={action.id}
          fieldName="action.initialDistanceOffset"
          value={inner.initialDistanceOffset ?? ''}
          placeholder="--"
          onValueChange={(v) => {
            if (v === '') {
              const { initialDistanceOffset: _, ...rest } = inner;
              onUpdate({ action: { ...rest } } as Partial<ScenarioAction>);
            } else {
              updateInner({ initialDistanceOffset: parseFloat(v) || 0 });
            }
          }}
          acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
          className="h-8 text-sm"
        />
      </OptionalFieldWrapper>

      {/* Time Reference */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Time Reference</p>
        <div className="grid gap-1">
          <Label className="text-xs">Mode</Label>
          <SegmentedControl
            value={timeRefMode}
            options={['none', 'timing'] as const}
            onValueChange={handleTimeRefChange}
            labels={{ none: 'None', timing: 'Timing' }}
          />
        </div>

        {inner.timeReference.timing && (
          <>
            <div className="grid gap-1">
              <Label className="text-xs">Domain</Label>
              <SegmentedControl
                value={inner.timeReference.timing.domainAbsoluteRelative}
                options={['absolute', 'relative'] as const}
                onValueChange={(v) =>
                  updateTiming({ domainAbsoluteRelative: v as 'absolute' | 'relative' })
                }
                labels={{ absolute: 'Absolute', relative: 'Relative' }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <Label className="text-xs">Offset (s)</Label>
                <ParameterAwareInput
                  elementId={action.id}
                  fieldName="action.timeReference.timing.offset"
                  value={inner.timeReference.timing.offset}
                  onValueChange={(v) => updateTiming({ offset: parseFloat(v) || 0 })}
                  acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
                  className="h-8 text-sm"
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Scale</Label>
                <ParameterAwareInput
                  elementId={action.id}
                  fieldName="action.timeReference.timing.scale"
                  value={inner.timeReference.timing.scale}
                  onValueChange={(v) => updateTiming({ scale: parseFloat(v) || 0 })}
                  acceptedTypes={['double', 'int', 'unsignedInt', 'unsignedShort']}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Trajectory */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Trajectory</p>
        <div className="grid gap-1">
          <Label className="text-xs">Name</Label>
          <Input
            value={inner.trajectory.name}
            onChange={(e) => updateTrajectory({ name: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={inner.trajectory.closed}
            onChange={(e) => updateTrajectory({ closed: e.target.checked })}
          />
          Closed
        </label>

        <div className="grid gap-1">
          <Label className="text-xs">Shape Type</Label>
          <SegmentedControl
            value={shapeType}
            options={['polyline', 'clothoid', 'nurbs'] as const}
            onValueChange={handleShapeTypeChange}
            labels={{ polyline: 'Polyline', clothoid: 'Clothoid', nurbs: 'NURBS' }}
          />
        </div>

        {/* ===== Polyline ===== */}
        {polylineShape && (
          <div className="space-y-1">
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
                {polylineShape.vertices.map((vertex, i) => (
                  <TrajectoryVertexListItem
                    key={i}
                    index={i}
                    vertex={vertex}
                    isSelected={false}
                    onSelect={() => {}}
                    onDelete={() => handleDeleteVertex(i)}
                    onTimeChange={(time) => handleVertexTimeChange(i, time)}
                  />
                ))}
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
        )}

        {/* ===== Clothoid ===== */}
        {clothoidShape && (
          <div className="space-y-2">
            <div className="grid gap-1">
              <Label className="text-xs">Curvature</Label>
              <ParameterAwareInput
                elementId={action.id}
                fieldName="action.trajectory.shape.curvature"
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
                fieldName="action.trajectory.shape.curvatureDot"
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
                fieldName="action.trajectory.shape.length"
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
                  fieldName="action.trajectory.shape.startTime"
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
                  fieldName="action.trajectory.shape.stopTime"
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
        )}

        {/* ===== NURBS ===== */}
        {nurbsShape && (
          <div className="space-y-2">
            <div className="grid gap-1">
              <Label className="text-xs">Order</Label>
              <ParameterAwareInput
                elementId={action.id}
                fieldName="action.trajectory.shape.order"
                value={nurbsShape.order}
                onValueChange={(v) => updateNurbs({ order: parseInt(v) || 3 })}
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
                  {nurbsShape.controlPoints.map((cp, i) => (
                    <NurbsControlPointListItem
                      key={i}
                      index={i}
                      controlPoint={cp}
                      isSelected={false}
                      onSelect={() => {}}
                      onDelete={() => handleDeleteControlPoint(i)}
                      onTimeChange={(time) => handleControlPointTimeChange(i, time)}
                      onWeightChange={(weight) => handleControlPointWeightChange(i, weight)}
                    />
                  ))}
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
              expectedLength={
                nurbsShape.controlPoints.length > 0
                  ? nurbsShape.controlPoints.length + nurbsShape.order
                  : undefined
              }
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
        )}
      </div>
    </div>
  );
}
