import { useState, useMemo } from 'react';
import { useTranslation } from '@osce/i18n';
import type {
  ScenarioAction,
  FollowTrajectoryAction,
  Trajectory,
  TrajectoryShape,
  TrajectoryVertex,
  NurbsControlPoint,
  TimeReference,
  Position,
  Orientation,
  WorldPosition,
} from '@osce/shared';
import type { FollowingMode } from '@osce/shared';
import { FOLLOWING_MODES, REFERENCE_CONTEXTS } from '@osce/shared';
import { Label } from '../../../../../components/ui/label';
import { Input } from '../../../../../components/ui/input';
import { ParameterAwareInput } from '../ParameterAwareInput';
import { SegmentedControl } from '../SegmentedControl';
import { OptionalFieldWrapper } from '../OptionalFieldWrapper';
import { generateClampedUniformKnots } from '../../../../../lib/nurbs-knot-utils';
import { actionBody, actionUpdate } from '../lib/typed-updates';
import { useTrajectoryEditStore } from '../../../../../stores/trajectory-edit-store';
import { useRouteEditStore } from '../../../../../stores/route-edit-store';
import { useScenarioStoreApi } from '../../../../../stores/use-scenario-store';
import { findManeuverGroupForAction } from '@osce/scenario-engine';
import { PolylineSection } from './follow-trajectory/PolylineSection';
import { ClothoidSection } from './follow-trajectory/ClothoidSection';
import { NurbsSection } from './follow-trajectory/NurbsSection';

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

  // Resolve owner entity for "Start from entity position" feature
  const scenarioStoreApi = useScenarioStoreApi();
  const { t } = useTranslation('openscenario');
  const ownerEntityName = useMemo(() => {
    const doc = scenarioStoreApi.getState().document;
    const result = findManeuverGroupForAction(doc, action.id);
    if (!result) return undefined;
    return result.group.actors.entityRefs[0];
  }, [scenarioStoreApi, action.id]);

  const handleEditIn3D = () => {
    if (!canEditIn3D || !inner.trajectory) return;
    useTrajectoryEditStore.getState().enterTrajectoryEditMode(
      { type: 'action', actionId: action.id },
      inner.trajectory,
    );
  };

  const updateInner = (updates: Partial<FollowTrajectoryAction>) => {
    onUpdate(actionUpdate(inner, updates));
  };

  const timeRefMode: 'none' | 'timing' = inner.timeReference.timing ? 'timing' : 'none';
  const shapeType = inner.trajectory?.shape.type;

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
    if (!inner.trajectory) return;
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
  const polylineShape = shapeType === 'polyline' && inner.trajectory
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
    if (index < relativePointCount) return;
    updatePolylineVertices(polylineShape.vertices.filter((_, i) => i !== index));
  };

  const handleVertexTimeChange = (index: number, time: number | undefined) => {
    if (!polylineShape) return;
    updatePolylineVertices(
      polylineShape.vertices.map((v, i) => (i === index ? { ...v, time } : v)),
    );
  };

  // --- Vertex expansion & orientation ---
  const [expandedVertexIndex, setExpandedVertexIndex] = useState<number | null>(null);

  const handleVertexOrientationChange = (index: number, orientation: Orientation | undefined) => {
    if (!polylineShape) return;
    updatePolylineVertices(
      polylineShape.vertices.map((v, i) => {
        if (i !== index) return v;
        const pos = v.position;
        if (pos.type === 'worldPosition') {
          // WorldPosition stores h/p/r directly
          const wp = pos as WorldPosition;
          return {
            ...v,
            position: {
              ...wp,
              h: orientation?.h,
              p: orientation?.p,
              r: orientation?.r,
            } as Position,
          };
        }
        // All other position types use orientation sub-object
        return {
          ...v,
          position: { ...pos, orientation } as Position,
        };
      }),
    );
  };

  // --- NURBS shape & helpers (declared early for start-from-entity logic) ---
  const nurbsShape = shapeType === 'nurbs' && inner.trajectory
    ? (inner.trajectory.shape as Extract<TrajectoryShape, { type: 'nurbs' }>)
    : null;

  const updateNurbs = (updates: Partial<Extract<TrajectoryShape, { type: 'nurbs' }>>) => {
    if (!nurbsShape) return;
    updateTrajectory({ shape: { ...nurbsShape, ...updates } });
  };

  const autoRegenerateKnots = (newCpCount: number, currentOrder: number, currentKnots: number[]) => {
    if (newCpCount < 2) return currentKnots;
    const expectedLen = newCpCount + currentOrder;
    if (currentKnots.length === 0 || currentKnots.length === expectedLen - 1 || currentKnots.length === expectedLen + 1) {
      return generateClampedUniformKnots(newCpCount, currentOrder);
    }
    return currentKnots;
  };

  // --- Start from entity position (shared across polyline & NURBS) ---
  const relativeEntityPosition: Position = ownerEntityName
    ? {
        type: 'relativeObjectPosition',
        entityRef: ownerEntityName,
        dx: 0,
        dy: 0,
      }
    : DEFAULT_WORLD_POSITION;

  const isFirstPositionRelativeToEntity = (pos: Position | undefined): boolean => {
    if (!ownerEntityName || !pos) return false;
    return (
      pos.type === 'relativeObjectPosition' &&
      pos.entityRef === ownerEntityName
    );
  };

  const relativePointCount = useMemo(() => {
    const points = polylineShape?.vertices ?? nurbsShape?.controlPoints;
    if (!points || !ownerEntityName) return 0;
    let count = 0;
    for (let i = 0; i < Math.min(points.length, 2); i++) {
      if (isFirstPositionRelativeToEntity(points[i].position)) count++;
      else break; // Only count leading consecutive relative points
    }
    return count;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerEntityName, polylineShape, nurbsShape]);

  // All hooks have been called above. Now safe to do catalog-reference early return.
  if (!inner.trajectory) {
    const entryName = inner.trajectoryRef?.entryName;
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Following Mode</p>
          <SegmentedControl
            value={inner.followingMode}
            options={FOLLOWING_MODES}
            onValueChange={(v) => updateInner({ followingMode: v as FollowingMode })}
            labels={{ position: 'Position', follow: 'Follow' }}
          />
        </div>
        <div className="px-2 py-3 space-y-1">
          <p className="text-xs text-muted-foreground">
            {t('trajectoryFields.catalogReferenceNotice')}
            {entryName ? `: "${entryName}"` : ''}
          </p>
        </div>
      </div>
    );
  }

  // After the early return above, inner.trajectory is guaranteed to be defined.
  // Re-derive shapeType with a non-optional type for use in JSX below.
  const definedShapeType = inner.trajectory.shape.type;

  // ClothoidSpline is not yet editable — show a notice instead of the shape editor.
  if (definedShapeType === 'clothoidSpline') {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Following Mode</p>
          <SegmentedControl
            value={inner.followingMode}
            options={FOLLOWING_MODES}
            onValueChange={(v) => updateInner({ followingMode: v as FollowingMode })}
            labels={{ position: 'Position', follow: 'Follow' }}
          />
        </div>
        <div className="px-2 py-3">
          <p className="text-xs text-muted-foreground">{t('trajectoryFields.clothoidSplineNotice')}</p>
        </div>
      </div>
    );
  }

  const handleRelativePointCountChange = (newCountStr: string) => {
    const targetCount = parseInt(newCountStr);
    if (!ownerEntityName || isNaN(targetCount)) return;

    if (polylineShape) {
      let vertices = [...polylineShape.vertices];
      // Ensure enough vertices exist
      while (vertices.length < targetCount) {
        vertices.push({ position: { ...DEFAULT_WORLD_POSITION }, time: vertices.length === 0 ? 0 : undefined });
      }
      vertices = vertices.map((v, i) => {
        if (i < targetCount) {
          return { ...v, position: { ...relativeEntityPosition } };
        } else if (i < 2 && isFirstPositionRelativeToEntity(v.position)) {
          return { ...v, position: { ...DEFAULT_WORLD_POSITION } };
        }
        return v;
      });
      updatePolylineVertices(vertices);
    } else if (nurbsShape) {
      let controlPoints = [...nurbsShape.controlPoints];
      while (controlPoints.length < targetCount) {
        controlPoints.push({ position: { ...DEFAULT_WORLD_POSITION }, weight: 1.0, time: controlPoints.length === 0 ? 0 : undefined });
      }
      controlPoints = controlPoints.map((cp, i) => {
        if (i < targetCount) {
          return { ...cp, position: { ...relativeEntityPosition } };
        } else if (i < 2 && isFirstPositionRelativeToEntity(cp.position)) {
          return { ...cp, position: { ...DEFAULT_WORLD_POSITION } };
        }
        return cp;
      });
      const knots = autoRegenerateKnots(controlPoints.length, nurbsShape.order, nurbsShape.knots);
      updateNurbs({ controlPoints, knots });
    }
  };

  // --- Clothoid helpers ---
  const clothoidShape = shapeType === 'clothoid' && inner.trajectory
    ? (inner.trajectory.shape as Extract<TrajectoryShape, { type: 'clothoid' }>)
    : null;

  const updateClothoid = (updates: Partial<Extract<TrajectoryShape, { type: 'clothoid' }>>) => {
    if (!clothoidShape) return;
    updateTrajectory({ shape: { ...clothoidShape, ...updates } });
  };

  const handleAddControlPoint = () => {
    if (!nurbsShape) return;
    const newCp: NurbsControlPoint = { position: { ...DEFAULT_WORLD_POSITION }, weight: 1.0 };
    const newCps = [...nurbsShape.controlPoints, newCp];
    const knots = autoRegenerateKnots(newCps.length, nurbsShape.order, nurbsShape.knots);
    updateNurbs({ controlPoints: newCps, knots });
  };

  const handleDeleteControlPoint = (index: number) => {
    if (!nurbsShape) return;
    if (index < relativePointCount) return;
    const newCps = nurbsShape.controlPoints.filter((_, i) => i !== index);
    const knots = autoRegenerateKnots(newCps.length, nurbsShape.order, nurbsShape.knots);
    updateNurbs({ controlPoints: newCps, knots });
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
          options={FOLLOWING_MODES}
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
          onUpdate(actionBody(rest));
        }}
      >
        <ParameterAwareInput
          elementId={action.id}
          fieldName="initialDistanceOffset"
          value={inner.initialDistanceOffset ?? ''}
          placeholder="--"
          onValueChange={(v) => {
            if (v === '') {
              const { initialDistanceOffset: _, ...rest } = inner;
              onUpdate(actionBody(rest));
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
                options={REFERENCE_CONTEXTS}
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
                  fieldName="timeReference.timing.offset"
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
                  fieldName="timeReference.timing.scale"
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
            value={definedShapeType}
            options={['polyline', 'clothoid', 'nurbs'] as const}
            onValueChange={handleShapeTypeChange}
            labels={{ polyline: 'Polyline', clothoid: 'Clothoid', nurbs: 'NURBS' }}
          />
        </div>

        {/* ===== Polyline ===== */}
        {polylineShape && (
          <PolylineSection
            ownerEntityName={ownerEntityName}
            relativePointCount={relativePointCount}
            handleRelativePointCountChange={handleRelativePointCountChange}
            polylineShape={polylineShape}
            handleAddVertex={handleAddVertex}
            expandedVertexIndex={expandedVertexIndex}
            setExpandedVertexIndex={setExpandedVertexIndex}
            handleDeleteVertex={handleDeleteVertex}
            handleVertexTimeChange={handleVertexTimeChange}
            handleVertexOrientationChange={handleVertexOrientationChange}
            action={action}
            isEditingThisTrajectory={isEditingThisTrajectory}
            handleEditIn3D={handleEditIn3D}
            canEditIn3D={canEditIn3D}
          />
        )}

        {/* ===== Clothoid ===== */}
        {clothoidShape && (
          <ClothoidSection
            clothoidShape={clothoidShape}
            action={action}
            updateClothoid={updateClothoid}
            updateTrajectory={updateTrajectory}
            DEFAULT_WORLD_POSITION={DEFAULT_WORLD_POSITION}
            isEditingThisTrajectory={isEditingThisTrajectory}
            handleEditIn3D={handleEditIn3D}
            canEditIn3D={canEditIn3D}
          />
        )}

        {/* ===== NURBS ===== */}
        {nurbsShape && (
          <NurbsSection
            nurbsShape={nurbsShape}
            ownerEntityName={ownerEntityName}
            relativePointCount={relativePointCount}
            handleRelativePointCountChange={handleRelativePointCountChange}
            action={action}
            updateNurbs={updateNurbs}
            handleAddControlPoint={handleAddControlPoint}
            handleDeleteControlPoint={handleDeleteControlPoint}
            handleControlPointTimeChange={handleControlPointTimeChange}
            handleControlPointWeightChange={handleControlPointWeightChange}
            isEditingThisTrajectory={isEditingThisTrajectory}
            handleEditIn3D={handleEditIn3D}
            canEditIn3D={canEditIn3D}
          />
        )}
      </div>
    </div>
  );
}
