import { AlertTriangle, MapPin, Navigation2, Trash2 } from 'lucide-react';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { useCatalogStore } from '../../stores/catalog-store';
import { useTrajectoryEditStore } from '../../stores/trajectory-edit-store';
import type {
  CatalogEntry,
  Trajectory,
  TrajectoryVertex,
  NurbsControlPoint,
} from '@osce/shared';
import { formatPosition } from '../property/actions/TrajectoryVertexListItem';

interface TrajectoryFieldsProps {
  entry: { catalogType: 'trajectory'; definition: Trajectory };
  onUpdate: (entry: CatalogEntry) => void;
}

const SHAPE_LABELS: Record<string, string> = {
  polyline: 'Polyline',
  clothoid: 'Clothoid',
  nurbs: 'NURBS',
};

export function TrajectoryFields({ entry, onUpdate }: TrajectoryFieldsProps) {
  const def = entry.definition;
  const shape = def.shape;
  const selectedCatalogName = useCatalogStore((s) => s.selectedCatalogName);
  const selectedEntryIndex = useCatalogStore((s) => s.selectedEntryIndex);

  const trajectoryEditActive = useTrajectoryEditStore((s) => s.active);
  const trajectoryEditSource = useTrajectoryEditStore((s) => s.source);

  const isEditingThis =
    trajectoryEditActive &&
    trajectoryEditSource?.type === 'catalog' &&
    trajectoryEditSource.catalogName === selectedCatalogName &&
    trajectoryEditSource.entryIndex === selectedEntryIndex;

  const handleToggleClosed = () => {
    onUpdate({
      ...entry,
      definition: { ...def, closed: !def.closed },
    });
  };

  const handleDeleteVertex = (index: number) => {
    if (shape.type !== 'polyline') return;
    const vertices = shape.vertices.filter((_, i) => i !== index);
    onUpdate({
      ...entry,
      definition: { ...def, shape: { type: 'polyline', vertices } },
    });
  };

  const handleDeleteControlPoint = (index: number) => {
    if (shape.type !== 'nurbs') return;
    const controlPoints = shape.controlPoints.filter((_, i) => i !== index);
    onUpdate({
      ...entry,
      definition: { ...def, shape: { ...shape, controlPoints } },
    });
  };

  const handleEditIn3D = () => {
    if (!selectedCatalogName || selectedEntryIndex === null) return;
    useTrajectoryEditStore.getState().enterTrajectoryEditMode(
      { type: 'catalog', catalogName: selectedCatalogName, entryIndex: selectedEntryIndex },
      def,
    );
  };

  // Point count and validation
  let pointCount = 0;
  let warningMessage: string | null = null;
  if (shape.type === 'polyline') {
    pointCount = shape.vertices.length;
    if (pointCount < 2) warningMessage = 'Polyline requires at least 2 vertices';
  } else if (shape.type === 'clothoid') {
    pointCount = shape.position ? 1 : 0;
    if (shape.length <= 0) warningMessage = 'Clothoid length must be > 0';
  } else if (shape.type === 'nurbs') {
    pointCount = shape.controlPoints.length;
    if (pointCount < 2) warningMessage = 'NURBS requires at least 2 control points';
  }

  return (
    <>
      {/* Shape type badge */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-none border border-[var(--color-glass-edge)] text-[var(--color-text-secondary)]">
          {SHAPE_LABELS[shape.type]}
        </span>
      </div>

      {/* Closed toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          role="checkbox"
          aria-checked={def.closed}
          onClick={handleToggleClosed}
          className={
            'h-4 w-4 shrink-0 rounded-none border border-input transition-colors ' +
            (def.closed
              ? 'bg-primary border-primary'
              : 'bg-transparent hover:border-muted-foreground')
          }
        >
          {def.closed && (
            <svg
              className="h-4 w-4 text-primary-foreground"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 8l3 3 5-5" />
            </svg>
          )}
        </button>
        <Label className="text-xs cursor-pointer" onClick={handleToggleClosed}>
          Closed trajectory (loop)
        </Label>
      </div>

      {/* Warning */}
      {warningMessage && (
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-none bg-yellow-500/10 border border-yellow-500/30">
          <AlertTriangle className="h-3 w-3 text-yellow-500 shrink-0" />
          <span className="text-[10px] text-yellow-500">{warningMessage}</span>
        </div>
      )}

      {/* Polyline vertices */}
      {shape.type === 'polyline' && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground">
            Vertices ({shape.vertices.length})
          </p>
          <div className="max-h-[200px] overflow-auto space-y-0.5">
            {shape.vertices.map((vertex: TrajectoryVertex, i: number) => (
              <div
                key={i}
                className="group flex items-center gap-1 px-1.5 py-1 rounded-none hover:bg-[var(--color-glass-hover)] transition-colors"
              >
                <span className="text-[10px] text-muted-foreground w-5 shrink-0 text-center font-mono">
                  #{i}
                </span>
                <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-[10px] truncate flex-1 min-w-0" title={formatPosition(vertex.position)}>
                  {formatPosition(vertex.position)}
                </span>
                {vertex.time !== undefined && (
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {vertex.time.toFixed(1)}s
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => handleDeleteVertex(i)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
            {shape.vertices.length === 0 && (
              <p className="text-[10px] text-muted-foreground text-center py-2 italic">
                No vertices defined
              </p>
            )}
          </div>
        </div>
      )}

      {/* Clothoid summary */}
      {shape.type === 'clothoid' && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground">Parameters</p>
          <div className="grid grid-cols-3 gap-1 text-[10px]">
            <div className="px-1.5 py-1 rounded-none bg-[var(--color-glass-1)]">
              <span className="text-muted-foreground">κ </span>
              {shape.curvature.toFixed(4)}
            </div>
            <div className="px-1.5 py-1 rounded-none bg-[var(--color-glass-1)]">
              <span className="text-muted-foreground">κ̇ </span>
              {shape.curvatureDot.toFixed(5)}
            </div>
            <div className="px-1.5 py-1 rounded-none bg-[var(--color-glass-1)]">
              <span className="text-muted-foreground">L </span>
              {shape.length.toFixed(1)}m
            </div>
          </div>
        </div>
      )}

      {/* NURBS summary */}
      {shape.type === 'nurbs' && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground">
            Control Points ({shape.controlPoints.length}) · Order {shape.order}
          </p>
          <div className="max-h-[200px] overflow-auto space-y-0.5">
            {shape.controlPoints.map((cp: NurbsControlPoint, i: number) => (
              <div
                key={i}
                className="group flex items-center gap-1 px-1.5 py-1 rounded-none hover:bg-[var(--color-glass-hover)] transition-colors"
              >
                <span className="text-[10px] text-muted-foreground w-5 shrink-0 text-center font-mono">
                  #{i}
                </span>
                <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-[10px] truncate flex-1 min-w-0" title={formatPosition(cp.position)}>
                  {formatPosition(cp.position)}
                </span>
                {cp.weight !== undefined && (
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    w={cp.weight.toFixed(2)}
                  </span>
                )}
                {cp.time !== undefined && (
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {cp.time.toFixed(1)}s
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => handleDeleteControlPoint(i)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
            {shape.controlPoints.length === 0 && (
              <p className="text-[10px] text-muted-foreground text-center py-2 italic">
                No control points defined
              </p>
            )}
          </div>
        </div>
      )}

      {/* Edit in 3D button */}
      <div className="pt-1">
        {isEditingThis ? (
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-none bg-orange-500/10 border border-orange-500/30">
            <Navigation2 className="h-3 w-3 text-orange-500 animate-pulse" />
            <span className="text-[10px] text-orange-500 font-medium">
              Editing in 3D...
            </span>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full h-7 text-xs"
            onClick={handleEditIn3D}
            disabled={trajectoryEditActive}
          >
            <Navigation2 className="h-3 w-3 mr-1.5" />
            Edit in 3D
          </Button>
        )}
      </div>
    </>
  );
}
