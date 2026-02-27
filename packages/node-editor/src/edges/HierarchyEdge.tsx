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
      style={{ stroke: '#94a3b8', strokeWidth: 1.5 }}
    />
  );
}
