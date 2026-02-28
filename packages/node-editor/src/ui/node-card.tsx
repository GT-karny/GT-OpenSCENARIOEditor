/**
 * APEX-themed base card wrapper for all custom nodes.
 */

import type React from 'react';
import type { CSSProperties } from 'react';
import type { OsceNodeType } from '../types/node-types.js';
import { getNodeColor } from '../utils/color-map.js';

export interface NodeCardProps {
  nodeType: OsceNodeType;
  title: string;
  subtitle?: string;
  selected?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  badges?: React.ReactNode;
  children?: React.ReactNode;
}

export function NodeCard({
  nodeType,
  title,
  subtitle,
  selected,
  collapsed,
  onToggleCollapse,
  badges,
  children,
}: NodeCardProps) {
  const colors = getNodeColor(nodeType);

  const cardStyle: CSSProperties = {
    background: 'var(--color-glass-1, rgba(20, 14, 48, 0.48))',
    backdropFilter: 'blur(20px) saturate(1.2)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
    borderColor: colors.border,
    color: 'var(--color-text-primary, rgba(255, 255, 255, 0.93))',
    boxShadow: selected ? colors.glow : 'none',
  };

  const headerStyle: CSSProperties = {
    background: colors.accent,
  };

  return (
    <div
      className="rounded-lg border min-w-[160px] max-w-[280px] transition-shadow"
      style={cardStyle}
    >
      <div
        className="flex items-center justify-between px-3 py-2 rounded-t-md"
        style={headerStyle}
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{title}</div>
          {subtitle && <div className="text-xs opacity-50 truncate">{subtitle}</div>}
        </div>
        <div className="flex items-center gap-1 ml-2">
          {badges}
          {onToggleCollapse && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
              className="p-0.5 rounded hover:bg-white/5 text-xs opacity-60 hover:opacity-100 transition-opacity"
            >
              {collapsed ? '▶' : '▼'}
            </button>
          )}
        </div>
      </div>
      {!collapsed && children && (
        <div className="px-3 py-2 text-xs opacity-70">{children}</div>
      )}
    </div>
  );
}
