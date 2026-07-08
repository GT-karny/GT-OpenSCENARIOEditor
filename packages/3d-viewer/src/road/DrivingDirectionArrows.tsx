/**
 * Driving-direction arrow overlay.
 *
 * Renders small flat chevron arrows on every driving lane surface, pointing
 * along the actual travel direction. Direction is rule-aware (RHT/LHT and
 * left/right lanes) via computeDrivingHeading — see driving-direction-arrows.ts.
 *
 * All arrows for the whole document are merged into a single BufferGeometry to
 * keep the draw-call count at one, regardless of road/lane/sample count.
 *
 * Coordinates are in the OpenDRIVE z-up frame; this component is meant to be
 * rendered inside RoadNetwork's rotation group (which maps z-up → y-up).
 */

import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import type { OdrRoad } from '@osce/shared';
import {
  computeRoadArrowPlacements,
  DEFAULT_ARROW_SPACING,
  type ArrowPlacement,
} from './driving-direction-arrows.js';

interface DrivingDirectionArrowsProps {
  roads: OdrRoad[];
  /** Spacing between arrows along a lane, in metres. */
  spacing?: number;
}

/** Subtle amber tone, consistent with the trajectory/edit palette. */
const ARROW_COLOR = '#FFC24D';
/** Chevron half-length along the travel axis (metres). */
const ARROW_LENGTH = 1.6;
/** Chevron half-width across the travel axis (metres). */
const ARROW_WIDTH = 1.0;
/** Height above the lane surface to avoid z-fighting. */
const ARROW_Z_OFFSET = 0.05;

/**
 * Local chevron outline (flat, in the arrow's own XY plane, pointing +X).
 * Two triangles forming a filled arrowhead:
 *   tip forward, two barbs back, notch at the tail centre.
 */
const CHEVRON_VERTICES: ReadonlyArray<readonly [number, number]> = [
  [ARROW_LENGTH, 0], // tip
  [-ARROW_LENGTH, ARROW_WIDTH], // back-left barb
  [-ARROW_LENGTH * 0.4, 0], // tail notch
  [ARROW_LENGTH, 0], // tip
  [-ARROW_LENGTH * 0.4, 0], // tail notch
  [-ARROW_LENGTH, -ARROW_WIDTH], // back-right barb
];

function buildArrowGeometry(placements: ArrowPlacement[]): THREE.BufferGeometry {
  const vertsPerArrow = CHEVRON_VERTICES.length;
  const positions = new Float32Array(placements.length * vertsPerArrow * 3);

  let offset = 0;
  for (const p of placements) {
    const cos = Math.cos(p.heading);
    const sin = Math.sin(p.heading);
    for (const [lx, ly] of CHEVRON_VERTICES) {
      // Rotate the local chevron by heading around z, then translate to world.
      positions[offset] = p.x + lx * cos - ly * sin;
      positions[offset + 1] = p.y + lx * sin + ly * cos;
      positions[offset + 2] = p.z + ARROW_Z_OFFSET;
      offset += 3;
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  // meshBasicMaterial is unlit, so no vertex normals are needed.
  return geom;
}

export const DrivingDirectionArrows: React.FC<DrivingDirectionArrowsProps> = React.memo(
  ({ roads, spacing = DEFAULT_ARROW_SPACING }) => {
    const geometry = useMemo(() => {
      const placements: ArrowPlacement[] = [];
      for (const road of roads) {
        // road.rule participates in computeDrivingHeading, so a rule edit that
        // produces a new road reference re-runs this memo and flips the arrows.
        placements.push(...computeRoadArrowPlacements(road, spacing));
      }
      return buildArrowGeometry(placements);
    }, [roads, spacing]);

    // Dispose the previous geometry when a new one is created, and on unmount.
    useEffect(() => {
      return () => geometry.dispose();
    }, [geometry]);

    if (geometry.getAttribute('position').count === 0) return null;

    return (
      <mesh geometry={geometry}>
        <meshBasicMaterial
          color={ARROW_COLOR}
          side={THREE.DoubleSide}
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </mesh>
    );
  },
);

DrivingDirectionArrows.displayName = 'DrivingDirectionArrows';
