/**
 * APEX-themed node type color mapping.
 *
 * Each node type gets a unique accent color rendered as a small dot
 * in the header, matching the APEX v4 design mockup.
 * Borders use the uniform glass-edge style.
 */

import type { OsceNodeType } from '../types/node-types.js';

export interface NodeColorScheme {
  /** CSS color for the type-indicator dot */
  dot: string;
  /** CSS box-shadow glow for the dot */
  dotGlow: string;
  /** CSS box-shadow glow value for selected state */
  glow: string;
}

const colorMap: Record<OsceNodeType, NodeColorScheme> = {
  storyboard: {
    dot: '#94a3b8',
    dotGlow: 'rgba(148, 163, 184, 0.15)',
    glow: '0 0 8px rgba(148, 163, 184, 0.25), 0 0 16px rgba(148, 163, 184, 0.10)',
  },
  init: {
    dot: '#5DD8A8',
    dotGlow: 'rgba(93, 216, 168, 0.20)',
    glow: '0 0 8px rgba(93, 216, 168, 0.25), 0 0 16px rgba(93, 216, 168, 0.10)',
  },
  entity: {
    dot: '#88B8E8',
    dotGlow: 'rgba(136, 184, 232, 0.15)',
    glow: '0 0 8px rgba(136, 184, 232, 0.25), 0 0 16px rgba(136, 184, 232, 0.10)',
  },
  story: {
    dot: '#7B88E8',
    dotGlow: 'rgba(123, 136, 232, 0.10)',
    glow: '0 0 8px rgba(123, 136, 232, 0.25), 0 0 16px rgba(123, 136, 232, 0.10)',
  },
  act: {
    dot: '#9B84E8',
    dotGlow: 'rgba(155, 132, 232, 0.15)',
    glow: '0 0 8px rgba(155, 132, 232, 0.25), 0 0 16px rgba(155, 132, 232, 0.10)',
  },
  maneuverGroup: {
    dot: '#B8ABEB',
    dotGlow: 'rgba(184, 171, 235, 0.15)',
    glow: '0 0 8px rgba(184, 171, 235, 0.25), 0 0 16px rgba(184, 171, 235, 0.10)',
  },
  maneuver: {
    dot: '#D0C6F2',
    dotGlow: 'rgba(208, 198, 242, 0.15)',
    glow: '0 0 8px rgba(208, 198, 242, 0.25), 0 0 16px rgba(208, 198, 242, 0.10)',
  },
  event: {
    dot: '#E8C942',
    dotGlow: 'rgba(232, 201, 66, 0.20)',
    glow: '0 0 8px rgba(232, 201, 66, 0.25), 0 0 16px rgba(232, 201, 66, 0.10)',
  },
  action: {
    dot: '#E8A05A',
    dotGlow: 'rgba(232, 160, 90, 0.20)',
    glow: '0 0 8px rgba(232, 160, 90, 0.25), 0 0 16px rgba(232, 160, 90, 0.10)',
  },
  trigger: {
    dot: '#E88A8A',
    dotGlow: 'rgba(232, 138, 138, 0.20)',
    glow: '0 0 8px rgba(232, 138, 138, 0.25), 0 0 16px rgba(232, 138, 138, 0.10)',
  },
  condition: {
    dot: '#C8B4F0',
    dotGlow: 'rgba(200, 180, 240, 0.15)',
    glow: '0 0 8px rgba(200, 180, 240, 0.25), 0 0 16px rgba(200, 180, 240, 0.10)',
  },
};

export function getNodeColor(nodeType: OsceNodeType): NodeColorScheme {
  return colorMap[nodeType];
}
