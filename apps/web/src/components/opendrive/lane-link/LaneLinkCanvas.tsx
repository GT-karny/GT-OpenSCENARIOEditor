import { useMemo, useState, useCallback } from 'react';
import type { OdrJunctionConnection, OdrRoad, OdrLane } from '@osce/shared';

/** Color for driving lanes */
const LANE_COLOR = 'rgba(120, 120, 140, 0.6)';
const LANE_COLOR_HOVER = 'rgba(140, 140, 170, 0.8)';
const LINK_COLOR = 'rgba(155, 132, 232, 0.7)';
const LINK_COLOR_HOVER = 'rgba(155, 132, 232, 1)';
const LINK_COLOR_DRAG = 'rgba(180, 160, 240, 0.5)';

/** Layout constants */
const LANE_HEIGHT = 28;
const LANE_GAP = 2;
const BLOCK_WIDTH = 120;
const CENTER_GAP = 200;
const PADDING = 20;
const LABEL_HEIGHT = 24;

interface LaneBlock {
  laneId: number;
  y: number;
  label: string;
}

interface LaneLinkCanvasProps {
  connection: OdrJunctionConnection;
  incomingRoad: OdrRoad | undefined;
  connectingRoad: OdrRoad | undefined;
  onAddLink: (from: number, to: number) => void;
  onRemoveLink: (index: number) => void;
}

/**
 * SVG canvas for visually editing lane links within a junction connection.
 * Displays incoming road lanes on the left, connecting road lanes on the right,
 * with draggable connection lines between them.
 */
export function LaneLinkCanvas({
  connection,
  incomingRoad,
  connectingRoad,
  onAddLink,
  onRemoveLink,
}: LaneLinkCanvasProps) {
  const [hoveredLink, setHoveredLink] = useState<number | null>(null);
  const [dragState, setDragState] = useState<{
    fromSide: 'incoming' | 'connecting';
    laneId: number;
    mouseY: number;
  } | null>(null);

  // Compute lane blocks for incoming road
  const incomingLanes = useMemo((): LaneBlock[] => {
    if (!incomingRoad) return [];
    const section = incomingRoad.lanes[0];
    if (!section) return [];
    const driving = [...section.leftLanes, ...section.rightLanes].filter(
      (l) => l.type === 'driving' || l.type === 'bidirectional',
    );
    return driving.map((lane, i) => ({
      laneId: lane.id,
      y: PADDING + LABEL_HEIGHT + i * (LANE_HEIGHT + LANE_GAP),
      label: `Lane ${lane.id}`,
    }));
  }, [incomingRoad]);

  // Compute lane blocks for connecting road
  const connectingLanes = useMemo((): LaneBlock[] => {
    if (!connectingRoad) return [];
    const section = connectingRoad.lanes[0];
    if (!section) return [];
    const driving = [...section.leftLanes, ...section.rightLanes].filter(
      (l: OdrLane) => l.type === 'driving' || l.type === 'bidirectional',
    );
    return driving.map((lane, i) => ({
      laneId: lane.id,
      y: PADDING + LABEL_HEIGHT + i * (LANE_HEIGHT + LANE_GAP),
      label: `Lane ${lane.id}`,
    }));
  }, [connectingRoad]);

  const maxLanes = Math.max(incomingLanes.length, connectingLanes.length, 1);
  const svgHeight = PADDING * 2 + LABEL_HEIGHT + maxLanes * (LANE_HEIGHT + LANE_GAP);
  const svgWidth = PADDING * 2 + BLOCK_WIDTH * 2 + CENTER_GAP;

  const inX = PADDING;
  const connX = PADDING + BLOCK_WIDTH + CENTER_GAP;

  // Find lane center Y
  const getLaneCenterY = useCallback(
    (side: 'incoming' | 'connecting', laneId: number): number | null => {
      const lanes = side === 'incoming' ? incomingLanes : connectingLanes;
      const lane = lanes.find((l) => l.laneId === laneId);
      return lane ? lane.y + LANE_HEIGHT / 2 : null;
    },
    [incomingLanes, connectingLanes],
  );

  const handleLaneMouseDown = useCallback(
    (side: 'incoming' | 'connecting', laneId: number, e: React.MouseEvent) => {
      e.preventDefault();
      const svg = (e.target as SVGElement).closest('svg');
      if (!svg) return;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const svgPt = pt.matrixTransform(ctm.inverse());
      setDragState({ fromSide: side, laneId, mouseY: svgPt.y });
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!dragState) return;
      const svg = e.currentTarget;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const svgPt = pt.matrixTransform(ctm.inverse());
      setDragState((prev) => (prev ? { ...prev, mouseY: svgPt.y } : null));
    },
    [dragState],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!dragState) return;
      // Find which lane the mouse is over on the opposite side
      const svg = e.currentTarget;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const svgPt = pt.matrixTransform(ctm.inverse());

      const targetSide = dragState.fromSide === 'incoming' ? 'connecting' : 'incoming';
      const targetLanes = targetSide === 'incoming' ? incomingLanes : connectingLanes;

      const targetLane = targetLanes.find(
        (l) => svgPt.y >= l.y && svgPt.y <= l.y + LANE_HEIGHT,
      );

      if (targetLane) {
        const from =
          dragState.fromSide === 'incoming' ? dragState.laneId : targetLane.laneId;
        const to =
          dragState.fromSide === 'connecting' ? dragState.laneId : targetLane.laneId;

        // Check for duplicates
        const exists = connection.laneLinks.some(
          (ll) => ll.from === from && ll.to === to,
        );
        if (!exists) {
          onAddLink(from, to);
        }
      }

      setDragState(null);
    },
    [dragState, incomingLanes, connectingLanes, connection.laneLinks, onAddLink],
  );

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setDragState(null)}
    >
      {/* Labels */}
      <text
        x={inX + BLOCK_WIDTH / 2}
        y={PADDING + 14}
        textAnchor="middle"
        className="fill-[var(--color-text-secondary)]"
        fontSize="11"
        fontWeight="500"
      >
        Incoming (Road {connection.incomingRoad})
      </text>
      <text
        x={connX + BLOCK_WIDTH / 2}
        y={PADDING + 14}
        textAnchor="middle"
        className="fill-[var(--color-text-secondary)]"
        fontSize="11"
        fontWeight="500"
      >
        Connecting (Road {connection.connectingRoad})
      </text>

      {/* Incoming lanes */}
      {incomingLanes.map((lane) => (
        <g key={`in-${lane.laneId}`}>
          <rect
            x={inX}
            y={lane.y}
            width={BLOCK_WIDTH}
            height={LANE_HEIGHT}
            fill={LANE_COLOR}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={1}
            className="cursor-pointer"
            onMouseDown={(e) => handleLaneMouseDown('incoming', lane.laneId, e)}
            onMouseEnter={(e) => {
              (e.target as SVGRectElement).setAttribute('fill', LANE_COLOR_HOVER);
            }}
            onMouseLeave={(e) => {
              (e.target as SVGRectElement).setAttribute('fill', LANE_COLOR);
            }}
          />
          <text
            x={inX + BLOCK_WIDTH / 2}
            y={lane.y + LANE_HEIGHT / 2 + 4}
            textAnchor="middle"
            className="fill-[var(--color-text-primary)] pointer-events-none"
            fontSize="11"
          >
            {lane.label}
          </text>
        </g>
      ))}

      {/* Connecting lanes */}
      {connectingLanes.map((lane) => (
        <g key={`conn-${lane.laneId}`}>
          <rect
            x={connX}
            y={lane.y}
            width={BLOCK_WIDTH}
            height={LANE_HEIGHT}
            fill={LANE_COLOR}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={1}
            className="cursor-pointer"
            onMouseDown={(e) => handleLaneMouseDown('connecting', lane.laneId, e)}
            onMouseEnter={(e) => {
              (e.target as SVGRectElement).setAttribute('fill', LANE_COLOR_HOVER);
            }}
            onMouseLeave={(e) => {
              (e.target as SVGRectElement).setAttribute('fill', LANE_COLOR);
            }}
          />
          <text
            x={connX + BLOCK_WIDTH / 2}
            y={lane.y + LANE_HEIGHT / 2 + 4}
            textAnchor="middle"
            className="fill-[var(--color-text-primary)] pointer-events-none"
            fontSize="11"
          >
            {lane.label}
          </text>
        </g>
      ))}

      {/* Existing links */}
      {connection.laneLinks.map((ll, idx) => {
        const fromY = getLaneCenterY('incoming', ll.from);
        const toY = getLaneCenterY('connecting', ll.to);
        if (fromY === null || toY === null) return null;

        const x1 = inX + BLOCK_WIDTH;
        const x2 = connX;
        const cx1 = x1 + CENTER_GAP * 0.35;
        const cx2 = x2 - CENTER_GAP * 0.35;
        const isHovered = hoveredLink === idx;

        return (
          <g key={`link-${idx}`}>
            {/* Hit area (wider invisible path) */}
            <path
              d={`M ${x1} ${fromY} C ${cx1} ${fromY}, ${cx2} ${toY}, ${x2} ${toY}`}
              fill="none"
              stroke="transparent"
              strokeWidth={12}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredLink(idx)}
              onMouseLeave={() => setHoveredLink(null)}
              onClick={() => onRemoveLink(idx)}
            />
            {/* Visible path */}
            <path
              d={`M ${x1} ${fromY} C ${cx1} ${fromY}, ${cx2} ${toY}, ${x2} ${toY}`}
              fill="none"
              stroke={isHovered ? LINK_COLOR_HOVER : LINK_COLOR}
              strokeWidth={isHovered ? 3 : 2}
              className="pointer-events-none"
            />
            {/* Arrow head */}
            <polygon
              points={`${x2} ${toY}, ${x2 - 8} ${toY - 4}, ${x2 - 8} ${toY + 4}`}
              fill={isHovered ? LINK_COLOR_HOVER : LINK_COLOR}
              className="pointer-events-none"
            />
            {/* Delete indicator on hover */}
            {isHovered && (
              <text
                x={(x1 + x2) / 2}
                y={((fromY ?? 0) + (toY ?? 0)) / 2 - 8}
                textAnchor="middle"
                fontSize="10"
                className="fill-red-400 pointer-events-none"
              >
                Click to remove
              </text>
            )}
          </g>
        );
      })}

      {/* Drag preview */}
      {dragState && (() => {
        const fromCenterY = getLaneCenterY(dragState.fromSide, dragState.laneId);
        if (fromCenterY === null) return null;

        const isFromIncoming = dragState.fromSide === 'incoming';
        const x1 = isFromIncoming ? inX + BLOCK_WIDTH : connX;
        const x2 = isFromIncoming ? connX : inX + BLOCK_WIDTH;
        const mouseX = isFromIncoming ? connX - 10 : inX + BLOCK_WIDTH + 10;
        const cx1 = x1 + (x2 - x1) * 0.35;
        const cx2 = mouseX - (x2 - x1) * 0.35;

        return (
          <path
            d={`M ${x1} ${fromCenterY} C ${cx1} ${fromCenterY}, ${cx2} ${dragState.mouseY}, ${mouseX} ${dragState.mouseY}`}
            fill="none"
            stroke={LINK_COLOR_DRAG}
            strokeWidth={2}
            strokeDasharray="6 3"
            className="pointer-events-none"
          />
        );
      })()}

      {/* Empty state */}
      {incomingLanes.length === 0 && connectingLanes.length === 0 && (
        <text
          x={svgWidth / 2}
          y={svgHeight / 2}
          textAnchor="middle"
          className="fill-[var(--color-text-muted)]"
          fontSize="12"
        >
          No driving lanes found
        </text>
      )}
    </svg>
  );
}
