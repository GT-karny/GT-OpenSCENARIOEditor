/**
 * Custom styled React Flow Handle — APEX connector.
 */

import { Handle, type HandleProps } from '@xyflow/react';

export function NodeHandle(props: HandleProps) {
  return (
    <Handle
      {...props}
      className="!w-2.5 !h-2.5 !border-2"
      style={{
        background: 'var(--color-accent-bright, #D0C6F2)',
        borderColor: 'var(--color-bg-deep, #09061A)',
        boxShadow: '0 0 4px rgba(184, 171, 235, 0.3), 0 0 8px rgba(155, 132, 232, 0.15)',
      }}
    />
  );
}
