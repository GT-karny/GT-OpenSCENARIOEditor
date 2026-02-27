/**
 * Styled trigger reference edge (dashed, animated).
 */

import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react';

export function TriggerEdge(props: EdgeProps) {
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
      style={{ stroke: '#f43f5e', strokeWidth: 1.5, strokeDasharray: '5 5' }}
    />
  );
}
