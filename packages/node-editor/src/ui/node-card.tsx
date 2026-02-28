/**
 * APEX-themed base card wrapper for all custom nodes.
 *
 * Matches the APEX v4 design mockup (design-apex-v4.html):
 * - `.glass` CSS class for backdrop blur + cursor-reactive reflections
 * - Uniform glass-edge border (not per-type colored)
 * - Colored dot indicator in header for node-type differentiation
 * - Orbitron uppercase label for node titles
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

  const cardStyle = {
    color: 'var(--color-text-primary, rgba(255, 255, 255, 0.93))',
    boxShadow: selected
      ? colors.glow
      : '0 0 1px rgba(190, 180, 240, 0.4)',
    '--color-glass-1': 'var(--color-glass-node, rgba(24, 18, 56, 0.85))',
    '--color-glass-hover': 'var(--color-glass-node-hover, rgba(30, 22, 66, 0.88))',
    '--color-glass-active': 'var(--color-glass-node-active, rgba(38, 28, 76, 0.92))',
  } as CSSProperties;

  const stripeStyle: CSSProperties = {
    width: 18,
    height: 18,
    borderRadius: 3,
    background: `repeating-linear-gradient(
      -45deg,
      ${colors.dot}88,
      ${colors.dot}88 2px,
      transparent 2px,
      transparent 5px
    )`,
    border: `1px solid ${colors.dot}66`,
    flexShrink: 0,
  };

  const headerStyle: CSSProperties = {
    borderBottom: '1px solid var(--color-glass-edge, rgba(180, 170, 230, 0.07))',
  };

  const titleStyle: CSSProperties = {
    fontFamily: "var(--font-display, 'Orbitron', sans-serif)",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--color-primary, #B8ABEB)',
  };

  const accentBarStyle: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: '10%',
    bottom: '10%',
    width: 3,
    background: colors.dot,
    boxShadow: `0 0 8px ${colors.dot}66, 0 0 16px ${colors.dot}33`,
    borderRadius: '0 2px 2px 0',
    zIndex: 3,
  };

  return (
    <div
      className={`glass rounded-lg min-w-[168px] max-w-[280px] overflow-hidden ${selected ? 'glass-active' : ''}`}
      style={cardStyle}
    >
      {selected && <div style={accentBarStyle} />}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={headerStyle}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0" style={{ position: 'relative', zIndex: 2 }}>
          <span style={stripeStyle} />
          <div className="flex-1 min-w-0">
            <div className="truncate" style={titleStyle}>{title}</div>
            {subtitle && (
              <div
                className="truncate"
                style={{ fontSize: '10.5px', color: 'var(--color-text-secondary, rgba(255, 255, 255, 0.48))' }}
              >
                {subtitle}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2" style={{ position: 'relative', zIndex: 2 }}>
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
        <div
          className="px-3 py-2"
          style={{
            fontSize: '10.5px',
            color: 'var(--color-text-secondary, rgba(255, 255, 255, 0.48))',
            zIndex: 2,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
