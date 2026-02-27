/**
 * Base card wrapper for all custom nodes.
 */

import type React from 'react';
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

  return (
    <div
      className={`
        rounded-lg border-2 shadow-sm min-w-[160px] max-w-[280px]
        ${colors.bg} ${colors.border} ${colors.text}
        ${selected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
      `}
    >
      <div className={`flex items-center justify-between px-3 py-2 ${colors.accent} rounded-t-md`}>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{title}</div>
          {subtitle && <div className="text-xs opacity-70 truncate">{subtitle}</div>}
        </div>
        <div className="flex items-center gap-1 ml-2">
          {badges}
          {onToggleCollapse && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
              className="p-0.5 rounded hover:bg-black/10 text-xs"
            >
              {collapsed ? '▶' : '▼'}
            </button>
          )}
        </div>
      </div>
      {!collapsed && children && (
        <div className="px-3 py-2 text-xs">{children}</div>
      )}
    </div>
  );
}
