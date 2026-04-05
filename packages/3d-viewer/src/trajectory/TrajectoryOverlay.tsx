/**
 * Container component that renders trajectory point markers,
 * curve/connection lines, and the drag gizmo.
 * Supports all three shape types: polyline, clothoid, and nurbs.
 */

import React from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import type { OpenDriveDocument } from '@osce/shared';
import { TrajectoryPointMarker } from './TrajectoryPointMarker.js';
import { TrajectoryPointGizmo } from './TrajectoryPointGizmo.js';
import { TrajectoryConnectionLine } from './TrajectoryConnectionLine.js';

export interface TrajectoryOverlayProps {
  /** World positions of editable points (vertices / origin / control points) */
  points: Array<{ x: number; y: number; z: number; h: number }>;
  /** Evaluated curve sample points for rendering the trajectory path */
  curvePoints: Array<{ x: number; y: number; z: number }>;
  /** Optional time values per point (for polyline vertices / nurbs control points) */
  pointTimes?: Array<number | undefined>;
  selectedPointIndex: number | null;
  /** Shape type determines rendering behavior */
  shapeType: 'polyline' | 'clothoid' | 'nurbs';
  onPointClick?: (index: number) => void;
  onPointContextMenu?: (index: number, event: ThreeEvent<MouseEvent>) => void;
  onLineClick?: (event: ThreeEvent<MouseEvent>) => void;
  openDriveDocument?: OpenDriveDocument | null;
  orbitControlsRef?: React.RefObject<any>;
  onPointDragEnd?: (
    index: number,
    worldX: number,
    worldY: number,
    worldZ: number,
    heading: number,
    roadId: string,
    laneId: string,
    s: number,
    offset: number,
  ) => void;
}

export const TrajectoryOverlay: React.FC<TrajectoryOverlayProps> = React.memo(
  ({
    points,
    curvePoints,
    pointTimes,
    selectedPointIndex,
    shapeType,
    onPointClick,
    onPointContextMenu,
    onLineClick,
    openDriveDocument,
    orbitControlsRef,
    onPointDragEnd,
  }) => {
    const selectedPt =
      selectedPointIndex !== null ? points[selectedPointIndex] : null;

    return (
      <group>
        {/* Curve / connection line */}
        {curvePoints.length >= 2 && (
          <TrajectoryConnectionLine
            points={curvePoints}
            onClick={onLineClick}
          />
        )}

        {/* NURBS: dashed control polygon connecting control points */}
        {shapeType === 'nurbs' && points.length >= 2 && (
          <TrajectoryConnectionLine
            points={points.map((p) => ({ x: p.x, y: p.y, z: p.z }))}
            color="#FF880066"
            lineWidth={1.5}
            dashed
            dashSize={0.5}
            gapSize={0.3}
          />
        )}

        {/* Point markers */}
        {points.map((pt, idx) => (
          <TrajectoryPointMarker
            key={`traj-pt-${idx}`}
            position={[pt.x, pt.y, pt.z]}
            heading={pt.h}
            index={idx}
            isSelected={idx === selectedPointIndex}
            time={pointTimes?.[idx]}
            onClick={onPointClick ? () => onPointClick(idx) : undefined}
            onContextMenu={
              onPointContextMenu ? (e) => onPointContextMenu(idx, e) : undefined
            }
          />
        ))}

        {/* Drag gizmo for selected point */}
        {selectedPt && openDriveDocument && onPointDragEnd && selectedPointIndex !== null && (
          <TrajectoryPointGizmo
            position={[selectedPt.x, selectedPt.y, selectedPt.z]}
            openDriveDocument={openDriveDocument}
            orbitControlsRef={orbitControlsRef}
            onDragEnd={(wX, wY, wZ, h, rId, lId, s, off) =>
              onPointDragEnd(selectedPointIndex, wX, wY, wZ, h, rId, lId, s, off)
            }
          />
        )}
      </group>
    );
  },
);

TrajectoryOverlay.displayName = 'TrajectoryOverlay';
