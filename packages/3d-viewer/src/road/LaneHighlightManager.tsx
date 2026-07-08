/**
 * Centralized lane highlight manager.
 *
 * Uses MergedLaneMesh registration: one mesh per road, vertex-color-based highlight.
 *
 * A single useFrame callback handles all highlights — no per-instance useFrame needed.
 */

import { useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// ---------------------------------------------------------------------------
// Highlight color
// ---------------------------------------------------------------------------

const HIGHLIGHT_COLOR = new THREE.Color(0x3388cc);
const HIGHLIGHT_BLEND = 0.4; // lerp factor: 0 = base color, 1 = full highlight

// ---------------------------------------------------------------------------
// Merged lane mesh registry
// ---------------------------------------------------------------------------

export interface LaneVertexRange {
  laneId: number;
  startVertex: number;
  vertexCount: number;
  baseColor: THREE.Color;
}

interface MergedLaneEntry {
  mesh: THREE.Mesh;
  laneRanges: LaneVertexRange[];
}

const mergedRegistry = new Map<string, MergedLaneEntry>();

export function registerMergedLaneMesh(
  roadId: string,
  mesh: THREE.Mesh,
  laneRanges: LaneVertexRange[],
): void {
  mergedRegistry.set(roadId, { mesh, laneRanges });
}

export function unregisterMergedLaneMesh(roadId: string): void {
  mergedRegistry.delete(roadId);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface LaneHighlightManagerProps {
  highlightedLaneRef?: React.RefObject<{ roadId: string; laneId: number } | null>;
}

let lastHighlightKey: string | null = null;

const _blended = new THREE.Color();

/**
 * Runs a single useFrame to update lane highlights across all registered meshes.
 * Must be rendered inside the R3F Canvas tree.
 */
export function LaneHighlightManager({ highlightedLaneRef }: LaneHighlightManagerProps) {
  useEffect(() => {
    return () => {
      lastHighlightKey = null;
    };
  }, []);

  useFrame(() => {
    if (!highlightedLaneRef) return;

    const hl = highlightedLaneRef.current;
    const newKey = hl ? `${hl.roadId}:${hl.laneId}` : null;

    // Skip if nothing changed
    if (newKey === lastHighlightKey) return;

    // ---- Un-highlight previous ----
    if (lastHighlightKey) {
      unhighlightLane(lastHighlightKey);
    }

    // ---- Highlight new ----
    if (newKey && hl) {
      highlightLane(hl.roadId, hl.laneId);
    }

    lastHighlightKey = newKey;
  });

  return null;
}

// ---------------------------------------------------------------------------
// Highlight helpers
// ---------------------------------------------------------------------------

function unhighlightLane(key: string): void {
  const [roadId, laneIdStr] = key.split(':');
  const laneId = Number(laneIdStr);
  const merged = mergedRegistry.get(roadId);
  if (!merged) return;

  const colorAttr = merged.mesh.geometry.getAttribute('color') as THREE.BufferAttribute;
  if (!colorAttr) return;

  for (const range of merged.laneRanges) {
    if (range.laneId === laneId) {
      // Restore base color
      for (let i = 0; i < range.vertexCount; i++) {
        const vi = range.startVertex + i;
        colorAttr.setXYZ(vi, range.baseColor.r, range.baseColor.g, range.baseColor.b);
      }
      colorAttr.needsUpdate = true;
      break;
    }
  }
}

function highlightLane(roadId: string, laneId: number): void {
  const merged = mergedRegistry.get(roadId);
  if (!merged) return;

  const colorAttr = merged.mesh.geometry.getAttribute('color') as THREE.BufferAttribute;
  if (!colorAttr) return;

  for (const range of merged.laneRanges) {
    if (range.laneId === laneId) {
      // Blend base color with highlight color
      _blended.copy(range.baseColor).lerp(HIGHLIGHT_COLOR, HIGHLIGHT_BLEND);
      for (let i = 0; i < range.vertexCount; i++) {
        const vi = range.startVertex + i;
        colorAttr.setXYZ(vi, _blended.r, _blended.g, _blended.b);
      }
      colorAttr.needsUpdate = true;
      break;
    }
  }
}
