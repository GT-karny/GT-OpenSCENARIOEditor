/**
 * Custom styled React Flow Handle.
 */

import { Handle, type HandleProps } from '@xyflow/react';

export function NodeHandle(props: HandleProps) {
  return (
    <Handle
      {...props}
      className="!w-2 !h-2 !border-2"
      style={{ background: 'var(--color-glass-edge-bright, rgba(190, 180, 240, 0.22))', borderColor: 'var(--color-bg-deep, #09061A)' }}
    />
  );
}
