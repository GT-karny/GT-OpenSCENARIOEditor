/**
 * Styled parent-child edge (solid line).
 */

import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react';

export function HierarchyEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition } = props;
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 8,
  });

  return (
    <BaseEdge
      {...props}
      path={edgePath}
      style={{ stroke: 'rgba(184, 171, 235, 0.5)', strokeWidth: 2 }}
    />
  );
}
