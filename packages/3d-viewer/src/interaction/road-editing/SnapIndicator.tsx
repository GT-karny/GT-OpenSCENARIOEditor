/**
 * Visual indicator shown at snap target points.
 * Renders a glowing ring at road endpoints that are within snap range.
 */

import { useMemo } from 'react';
import type { OpenDriveDocument, OdrGeometry } from '@osce/shared';

interface SnapIndicatorProps {
  /** Full document to find snap targets */
  openDriveDocument: OpenDriveDocument;
  /** Road to exclude (the one being edited) */
  excludeRoadId?: string | null;
  /** Whether to show snap indicators */
  visible?: boolean;
}

function computeEndPosition(planView: readonly OdrGeometry[]): { x: number; y: number } | null {
  if (planView.length === 0) return null;
  const last = planView[planView.length - 1];
  if (last.type === 'arc' && last.curvature !== undefined && Math.abs(last.curvature) > 1e-10) {
    const c = last.curvature;
    const endHdg = last.hdg + c * last.length;
    const r = 1 / c;
    return {
      x: last.x + r * (Math.sin(endHdg) - Math.sin(last.hdg)),
      y: last.y + r * (-Math.cos(endHdg) + Math.cos(last.hdg)),
    };
  }
  return {
    x: last.x + Math.cos(last.hdg) * last.length,
    y: last.y + Math.sin(last.hdg) * last.length,
  };
}

export function SnapIndicator({
  openDriveDocument,
  excludeRoadId,
  visible = true,
}: SnapIndicatorProps) {
  const snapPoints = useMemo(() => {
    if (!visible) return [];
    const points: Array<{ x: number; y: number; type: 'start' | 'end' }> = [];

    for (const road of openDriveDocument.roads) {
      if (road.id === excludeRoadId) continue;
      if (road.planView.length === 0) continue;

      // Start point
      const start = road.planView[0];
      points.push({ x: start.x, y: start.y, type: 'start' });

      // End point
      const end = computeEndPosition(road.planView);
      if (end) {
        points.push({ x: end.x, y: end.y, type: 'end' });
      }
    }

    return points;
  }, [openDriveDocument.roads, excludeRoadId, visible]);

  if (!visible || snapPoints.length === 0) return null;

  return (
    <group>
      {snapPoints.map((pt, i) => (
        <mesh key={i} position={[pt.x, pt.y, 0.05]}>
          <ringGeometry args={[0.8, 1.0, 24]} />
          <meshBasicMaterial
            color={pt.type === 'start' ? '#4ade80' : '#f87171'}
            transparent
            opacity={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}
