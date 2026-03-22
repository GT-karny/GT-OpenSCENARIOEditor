import { MousePointer, Pencil, SplitSquareHorizontal, Scissors, Triangle, PlusSquare, GitMerge, Signpost, Crosshair, Move } from 'lucide-react';
import { useOdrSidebarStore } from '../../../hooks/use-opendrive-store';
import type { RoadToolMode, LaneEditSubMode, JunctionRoutingPreset, SignalTSnapMode } from '../../../hooks/use-opendrive-store';
import { BUILT_IN_PRESETS } from '@osce/opendrive-engine';

// ── Shared button components ─────────────────────────────────────────────────

function ToolButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
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

function SubModeButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`flex items-center gap-1 h-6 px-1.5 text-[10px] rounded-none transition-colors
        ${
          active
            ? 'text-[var(--color-text-primary)] bg-[var(--color-glass-hover)] border-b border-[var(--color-accent-vivid)]'
            : 'text-[var(--color-text-muted)] border-b border-transparent hover:text-[var(--color-text-primary)] hover:bg-[var(--color-glass-hover)]'
        }`}
      onClick={onClick}
    >
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </button>
  );
}

/** Two-option segment control — selected option gets glass-item cursor light */
function SegmentToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: [{ value: T; label: string }, { value: T; label: string }];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center h-6">
      {options.map((opt, i) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            className={`h-full px-2 text-[10px] transition-colors
              ${i === 0 ? 'border-r border-[var(--color-glass-edge)]' : ''}
              ${
                isActive
                  ? 'glass-item selected text-[var(--color-text-primary)] bg-[var(--color-glass-active)]'
                  : 'text-[var(--color-text-muted)] bg-[var(--color-glass-1)] border border-[var(--color-glass-edge)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-glass-2)]'
              }`}
            onClick={() => onChange(opt.value)}
          >
            <span className="relative z-[2]">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Checkbox-style toggle — when checked, gets glass-item cursor light */
function CheckToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      className={`flex items-center gap-1.5 h-6 px-2 text-[10px] cursor-pointer select-none group
        ${
          checked
            ? 'glass-item selected bg-[var(--color-glass-active)]'
            : 'bg-[var(--color-glass-1)] border border-[var(--color-glass-edge)]'
        }`}
      onClick={() => onChange(!checked)}
    >
      <span
        className={`relative z-[2] w-3 h-3 border flex items-center justify-center transition-colors
          ${
            checked
              ? 'border-[var(--color-accent-vivid)] bg-[var(--color-accent-vivid)]'
              : 'border-[var(--color-glass-edge-mid)] group-hover:border-[var(--color-text-muted)]'
          }`}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M2 6l3 3 5-5" />
          </svg>
        )}
      </span>
      <span className={`relative z-[2] transition-colors ${checked ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)]'}`}>
        {label}
      </span>
    </button>
  );
}

// ── Main toolbar ─────────────────────────────────────────────────────────────

interface RoadNetworkToolbarProps {
  cursorInfo?: {
    x: number;
    y: number;
    length: number;
    angle: number;
  } | null;
  onJunctionConfirm?: () => void;
  /** Name of the road currently hovered in select mode */
  hoveredRoadName?: string | null;
}

export function RoadNetworkToolbar({ cursorInfo, onJunctionConfirm, hoveredRoadName }: RoadNetworkToolbarProps) {
  const activeTool = useOdrSidebarStore((s) => s.activeTool);
  const setActiveTool = useOdrSidebarStore((s) => s.setActiveTool);
  const creationPhase = useOdrSidebarStore((s) => s.roadCreation.phase);

  const subMode = useOdrSidebarStore((s) => s.laneEdit.subMode);
  const setSubMode = useOdrSidebarStore((s) => s.setLaneEditSubMode);
  const taperDirection = useOdrSidebarStore((s) => s.laneEdit.taperDirection);
  const setTaperDirection = useOdrSidebarStore((s) => s.setTaperDirection);
  const taperPosition = useOdrSidebarStore((s) => s.laneEdit.taperPosition);
  const setTaperPosition = useOdrSidebarStore((s) => s.setTaperPosition);
  const useLaneOffset = useOdrSidebarStore((s) => s.laneEdit.useLaneOffset);
  const setUseLaneOffset = useOdrSidebarStore((s) => s.setUseLaneOffset);

  const handleToolClick = (tool: RoadToolMode) => {
    setActiveTool(tool);
  };

  const handleSubModeClick = (mode: LaneEditSubMode) => {
    setSubMode(mode);
  };

  const taperCreationPhase = useOdrSidebarStore((s) => s.laneEdit.taperCreation.phase);
  const taperStartS = useOdrSidebarStore((s) => s.laneEdit.taperCreation.startS);

  const junctionCreateEndpoints = useOdrSidebarStore((s) => s.junctionCreate.selectedEndpoints);
  const junctionRoutingPreset = useOdrSidebarStore((s) => s.junctionCreate.routingPreset);
  const setJunctionRoutingPreset = useOdrSidebarStore((s) => s.setJunctionRoutingPreset);

  const signalPlaceSubMode = useOdrSidebarStore((s) => s.signalPlace.subMode);
  const setSignalPlaceSubMode = useOdrSidebarStore((s) => s.setSignalPlaceSubMode);
  const signalPlacePresetId = useOdrSidebarStore((s) => s.signalPlace.selectedPresetId);
  const setSignalPlacePreset = useOdrSidebarStore((s) => s.setSignalPlacePreset);
  const signalPlaceTSnapMode = useOdrSidebarStore((s) => s.signalPlace.tSnapMode);
  const setSignalPlaceTSnapMode = useOdrSidebarStore((s) => s.setSignalPlaceTSnapMode);

  const hoveredLane = useOdrSidebarStore((s) => s.laneEdit.hoveredLane);
  const showRoadCreationDisplay = activeTool === 'road-create' && creationPhase === 'startPlaced';
  const showLaneEditDisplay = activeTool === 'lane-edit' && hoveredLane !== null;
  const showLaneSubModes = activeTool === 'lane-edit';
  const showJunctionCreate = activeTool === 'junction-create';
  const showSignalPlace = activeTool === 'signal-place';

  // ESC handling is centralized in RoadNetworkEditorLayout

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
        <ToolButton
          icon={GitMerge}
          label="Junction"
          active={activeTool === 'junction-create'}
          onClick={() => handleToolClick('junction-create')}
        />
        <ToolButton
          icon={Signpost}
          label="Signal"
          active={activeTool === 'signal-place'}
          onClick={() => handleToolClick('signal-place')}
        />
      </div>

      {/* Lane edit sub-mode buttons */}
      {showLaneSubModes && (
        <>
          <div className="w-px h-4 mx-2 bg-[var(--color-glass-edge)]" />
          <div className="flex items-center gap-0.5">
            <SubModeButton
              icon={PlusSquare}
              label="Add/Remove"
              active={subMode === 'select'}
              onClick={() => handleSubModeClick('select')}
            />
            <SubModeButton
              icon={Scissors}
              label="Split"
              active={subMode === 'split'}
              onClick={() => handleSubModeClick('split')}
            />
            <SubModeButton
              icon={Triangle}
              label="Taper"
              active={subMode === 'taper'}
              onClick={() => handleSubModeClick('taper')}
            />
          </div>

          {/* Taper options (only in taper mode) */}
          {subMode === 'taper' && (
            <>
              <div className="w-px h-4 mx-2 bg-[var(--color-glass-edge)]" />
              <div className="flex items-center gap-1.5">
                <SegmentToggle
                  options={[
                    { value: 'narrow-to-wide' as const, label: '+Lane' },
                    { value: 'wide-to-narrow' as const, label: '-Lane' },
                  ]}
                  value={taperDirection}
                  onChange={setTaperDirection}
                />
                <SegmentToggle
                  options={[
                    { value: 'outer' as const, label: 'Outer' },
                    { value: 'inner' as const, label: 'Inner' },
                  ]}
                  value={taperPosition}
                  onChange={setTaperPosition}
                />
                <CheckToggle
                  label="Symmetric"
                  checked={useLaneOffset}
                  onChange={setUseLaneOffset}
                />
              </div>
            </>
          )}
        </>
      )}

      {/* Junction create: routing preset + Create button */}
      {showJunctionCreate && (
        <>
          <div className="w-px h-4 mx-2 bg-[var(--color-glass-edge)]" />
          <SegmentToggle<JunctionRoutingPreset>
            options={[
              { value: 'all', label: 'All Lanes' },
              { value: 'dedicated', label: 'Dedicated' },
            ]}
            value={junctionRoutingPreset}
            onChange={setJunctionRoutingPreset}
          />
          <div className="w-px h-4 mx-1.5 bg-[var(--color-glass-edge)]" />
          <button
            type="button"
            disabled={junctionCreateEndpoints.length < 2}
            className={`flex items-center gap-1 h-6 px-2 text-[10px] rounded-none transition-colors
              ${
                junctionCreateEndpoints.length >= 2
                  ? 'text-[var(--color-text-primary)] bg-[var(--color-accent-vivid)] hover:opacity-90'
                  : 'text-[var(--color-text-muted)] bg-[var(--color-glass-1)] border border-[var(--color-glass-edge)] cursor-not-allowed opacity-50'
              }`}
            onClick={onJunctionConfirm}
          >
            <GitMerge className="w-3 h-3" />
            <span>Create Junction</span>
          </button>
        </>
      )}

      {/* Signal place: sub-mode + preset + t-snap */}
      {showSignalPlace && (
        <>
          <div className="w-px h-4 mx-2 bg-[var(--color-glass-edge)]" />
          <div className="flex items-center gap-0.5">
            <SubModeButton
              icon={Crosshair}
              label="Place"
              active={signalPlaceSubMode === 'place'}
              onClick={() => setSignalPlaceSubMode('place')}
            />
            <SubModeButton
              icon={Move}
              label="Move"
              active={signalPlaceSubMode === 'move'}
              onClick={() => setSignalPlaceSubMode('move')}
            />
          </div>

          <div className="w-px h-4 mx-2 bg-[var(--color-glass-edge)]" />
          <select
            value={signalPlacePresetId}
            onChange={(e) => setSignalPlacePreset(e.target.value)}
            className="h-6 px-1.5 text-[10px] bg-[var(--color-glass-1)] text-[var(--color-text-primary)] border border-[var(--color-glass-edge)] rounded-none outline-none"
          >
            {BUILT_IN_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>

          <div className="w-px h-4 mx-1.5 bg-[var(--color-glass-edge)]" />
          <SegmentToggle<SignalTSnapMode>
            options={[
              { value: 'lane-above', label: 'Lane Above' },
              { value: 'road-edge', label: 'Road Edge' },
            ]}
            value={signalPlaceTSnapMode}
            onChange={setSignalPlaceTSnapMode}
          />
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Status: junction create mode */}
      {showJunctionCreate && (
        <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--color-text-muted)] mr-3">
          <span className="text-[var(--color-accent-vivid)]">Selected: {junctionCreateEndpoints.length} endpoints</span>
          <span>Click road endpoints (min 2) · Enter to create · ESC cancel</span>
        </div>
      )}

      {/* Status: taper creation in-progress */}
      {showLaneSubModes && subMode === 'taper' && taperCreationPhase === 'idle' && (
        <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--color-text-muted)] mr-3">
          <span>Click road to set taper start</span>
        </div>
      )}
      {showLaneSubModes && subMode === 'taper' && taperCreationPhase === 'start-picked' && (
        <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--color-accent-vivid)] mr-3">
          <span>Start: s={taperStartS.toFixed(1)}m</span>
          <span className="text-[var(--color-text-muted)]">Click to set end · ESC cancel</span>
        </div>
      )}

      {/* Status: split mode hint */}
      {showLaneSubModes && subMode === 'split' && (
        <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--color-text-muted)] mr-3">
          <span>Click road to split section · ESC exit</span>
        </div>
      )}

      {/* Status: signal place mode */}
      {showSignalPlace && signalPlaceSubMode === 'place' && (
        <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--color-text-muted)] mr-3">
          <span>Click road to place signal · ESC cancel</span>
        </div>
      )}
      {showSignalPlace && signalPlaceSubMode === 'move' && (
        <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--color-text-muted)] mr-3">
          <span>Drag signal to move · ESC cancel</span>
        </div>
      )}

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

      {/* Right: Hovered road name — select mode */}
      {activeTool === 'select' && hoveredRoadName && (
        <div className="font-mono text-[11px] text-[var(--color-text-muted)]">
          {hoveredRoadName}
        </div>
      )}
    </div>
  );
}
