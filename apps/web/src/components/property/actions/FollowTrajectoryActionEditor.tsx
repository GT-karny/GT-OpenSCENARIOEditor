import type {
  ScenarioAction,
  FollowTrajectoryAction,
  Trajectory,
  TrajectoryShape,
  TimeReference,
} from '@osce/shared';
import type { FollowingMode } from '@osce/shared';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { SegmentedControl } from '../SegmentedControl';
import { OptionalFieldWrapper } from '../OptionalFieldWrapper';

interface FollowTrajectoryActionEditorProps {
  action: ScenarioAction;
  onUpdate: (partial: Partial<ScenarioAction>) => void;
}

export function FollowTrajectoryActionEditor({ action, onUpdate }: FollowTrajectoryActionEditorProps) {
  const inner = action.action as FollowTrajectoryAction;

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
        shape = { type: 'clothoid', curvature: 0, curvatureDot: 0, length: 0 };
        break;
      case 'nurbs':
        shape = { type: 'nurbs', order: 3, controlPoints: [], knots: [] };
        break;
      default:
        return;
    }
    updateTrajectory({ shape });
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
              onUpdate({
                action: { ...rest },
              } as Partial<ScenarioAction>);
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
                <Input
                  type="number"
                  value={inner.timeReference.timing.offset}
                  step="any"
                  onChange={(e) =>
                    updateTiming({ offset: parseFloat(e.target.value) || 0 })
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Scale</Label>
                <Input
                  type="number"
                  value={inner.timeReference.timing.scale}
                  step="any"
                  onChange={(e) =>
                    updateTiming({ scale: parseFloat(e.target.value) || 0 })
                  }
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

        {/* Shape-specific fields */}
        {shapeType === 'polyline' && inner.trajectory.shape.type === 'polyline' && (
          <div className="grid gap-1">
            <Label className="text-xs">Vertices (JSON)</Label>
            <textarea
              value={JSON.stringify(inner.trajectory.shape.vertices, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  if (Array.isArray(parsed)) {
                    updateTrajectory({
                      shape: { type: 'polyline', vertices: parsed },
                    });
                  }
                } catch {
                  // ignore invalid JSON while typing
                }
              }}
              className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono resize-y"
              spellCheck={false}
            />
          </div>
        )}

        {shapeType === 'clothoid' && inner.trajectory.shape.type === 'clothoid' && (
          <div className="space-y-2">
            <div className="grid gap-1">
              <Label className="text-xs">Curvature</Label>
              <Input
                type="number"
                value={inner.trajectory.shape.curvature}
                step="any"
                onChange={(e) =>
                  updateTrajectory({
                    shape: {
                      ...inner.trajectory.shape as Extract<TrajectoryShape, { type: 'clothoid' }>,
                      curvature: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                className="h-8 text-sm"
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Curvature Dot</Label>
              <Input
                type="number"
                value={inner.trajectory.shape.curvatureDot}
                step="any"
                onChange={(e) =>
                  updateTrajectory({
                    shape: {
                      ...inner.trajectory.shape as Extract<TrajectoryShape, { type: 'clothoid' }>,
                      curvatureDot: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                className="h-8 text-sm"
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Length (m)</Label>
              <Input
                type="number"
                value={inner.trajectory.shape.length}
                step="any"
                onChange={(e) =>
                  updateTrajectory({
                    shape: {
                      ...inner.trajectory.shape as Extract<TrajectoryShape, { type: 'clothoid' }>,
                      length: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                className="h-8 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <Label className="text-xs">Start Time (s) (optional)</Label>
                <Input
                  type="number"
                  value={inner.trajectory.shape.startTime ?? ''}
                  placeholder="--"
                  step="any"
                  onChange={(e) => {
                    const clothoid = inner.trajectory.shape as Extract<TrajectoryShape, { type: 'clothoid' }>;
                    if (e.target.value === '') {
                      const { startTime: _, ...rest } = clothoid;
                      updateTrajectory({ shape: { ...rest, type: 'clothoid' } as TrajectoryShape });
                    } else {
                      updateTrajectory({
                        shape: { ...clothoid, startTime: parseFloat(e.target.value) || 0 },
                      });
                    }
                  }}
                  className="h-8 text-sm"
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Stop Time (s) (optional)</Label>
                <Input
                  type="number"
                  value={inner.trajectory.shape.stopTime ?? ''}
                  placeholder="--"
                  step="any"
                  onChange={(e) => {
                    const clothoid = inner.trajectory.shape as Extract<TrajectoryShape, { type: 'clothoid' }>;
                    if (e.target.value === '') {
                      const { stopTime: _, ...rest } = clothoid;
                      updateTrajectory({ shape: { ...rest, type: 'clothoid' } as TrajectoryShape });
                    } else {
                      updateTrajectory({
                        shape: { ...clothoid, stopTime: parseFloat(e.target.value) || 0 },
                      });
                    }
                  }}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {shapeType === 'nurbs' && inner.trajectory.shape.type === 'nurbs' && (
          <div className="space-y-2">
            <div className="grid gap-1">
              <Label className="text-xs">Order</Label>
              <Input
                type="number"
                value={inner.trajectory.shape.order}
                onChange={(e) =>
                  updateTrajectory({
                    shape: {
                      ...inner.trajectory.shape as Extract<TrajectoryShape, { type: 'nurbs' }>,
                      order: parseInt(e.target.value) || 3,
                    },
                  })
                }
                className="h-8 text-sm"
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Control Points (JSON)</Label>
              <textarea
                value={JSON.stringify(inner.trajectory.shape.controlPoints, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    if (Array.isArray(parsed)) {
                      const nurbs = inner.trajectory.shape as Extract<TrajectoryShape, { type: 'nurbs' }>;
                      updateTrajectory({
                        shape: { ...nurbs, controlPoints: parsed },
                      });
                    }
                  } catch {
                    // ignore invalid JSON while typing
                  }
                }}
                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono resize-y"
                spellCheck={false}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
