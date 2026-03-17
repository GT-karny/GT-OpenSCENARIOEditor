import { MousePointer, Pencil, SplitSquareHorizontal } from 'lucide-react';
import { useOdrSidebarStore } from '../../../hooks/use-opendrive-store';
import type { RoadToolMode } from '../../../hooks/use-opendrive-store';

interface ToolButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}

function ToolButton({ icon: Icon, label, active, onClick }: ToolButtonProps) {
  return (
    <button
      type="button"
      className={`flex items-center gap-1 h-7 px-2 text-xs rounded-none transition-colors
        ${
          active
            ? 'text-[var(--color-text-primary)] border-b-2 border-[var(--color-accent-vivid)] bg-[var(--color-glass-hover)]'
            : 'text-[var(--color-text-muted)] border-b-2 border-transparent hover:text-[var(--color-text-primary)] hover:bg-[var(--color-glass-hover)]'
        }`}
      onClick={onClick}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  );
}

interface RoadNetworkToolbarProps {
  /** Live cursor position and road metrics for numeric display */
  cursorInfo?: {
    x: number;
    y: number;
    length: number;
    angle: number;
  } | null;
}

export function RoadNetworkToolbar({ cursorInfo }: RoadNetworkToolbarProps) {
  const activeTool = useOdrSidebarStore((s) => s.activeTool);
  const setActiveTool = useOdrSidebarStore((s) => s.setActiveTool);
  const creationPhase = useOdrSidebarStore((s) => s.roadCreation.phase);

  const handleToolClick = (tool: RoadToolMode) => {
    setActiveTool(tool);
  };

  const hoveredLane = useOdrSidebarStore((s) => s.laneEdit.hoveredLane);
  const showRoadCreationDisplay = activeTool === 'road-create' && creationPhase === 'startPlaced';
  const showLaneEditDisplay = activeTool === 'lane-edit' && hoveredLane !== null;

  return (
    <div className="shrink-0 h-8 flex items-center px-2 glass backdrop-blur-[28px] border-b border-[var(--color-glass-edge)]">
      {/* Left: Tool buttons */}
      <div className="flex items-center gap-1">
        <ToolButton
          icon={MousePointer}
          label="Select"
          active={activeTool === 'select'}
          onClick={() => handleToolClick('select')}
        />
        <ToolButton
          icon={Pencil}
          label="Road"
          active={activeTool === 'road-create'}
          onClick={() => handleToolClick('road-create')}
        />
        <ToolButton
          icon={SplitSquareHorizontal}
          label="Lane"
          active={activeTool === 'lane-edit'}
          onClick={() => handleToolClick('lane-edit')}
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: Numeric display — road creation mode */}
      {showRoadCreationDisplay && cursorInfo && (
        <div className="flex items-center gap-3 font-mono text-[11px] text-[var(--color-text-muted)]">
          <span>X: {cursorInfo.x.toFixed(1)}</span>
          <span>Y: {cursorInfo.y.toFixed(1)}</span>
          <span>L: {cursorInfo.length.toFixed(1)}m</span>
          <span>∠: {cursorInfo.angle.toFixed(1)}°</span>
        </div>
      )}

      {/* Right: Numeric display — lane edit mode */}
      {showLaneEditDisplay && hoveredLane && (
        <div className="flex items-center gap-3 font-mono text-[11px] text-[var(--color-text-muted)]">
          <span>s: {hoveredLane.s.toFixed(1)}m</span>
          <span>Section: {hoveredLane.sectionIdx}</span>
          <span>Lane: {hoveredLane.laneId}</span>
        </div>
      )}
    </div>
  );
}
