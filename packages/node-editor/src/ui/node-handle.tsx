/**
 * Custom styled React Flow Handle.
 */

import { Handle, type HandleProps } from '@xyflow/react';

export function NodeHandle(props: HandleProps) {
  return (
    <Handle
      {...props}
      className="!w-2 !h-2 !bg-gray-400 !border-2 !border-white"
    />
  );
}
