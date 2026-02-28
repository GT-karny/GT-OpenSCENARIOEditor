/**
 * APEX-themed node type color mapping.
 * Uses CSS custom properties defined in globals.css.
 */

import type { OsceNodeType } from '../types/node-types.js';

export interface NodeColorScheme {
  /** CSS border-color value (node accent color) */
  border: string;
  /** CSS background for header area (low-opacity accent) */
  accent: string;
  /** CSS box-shadow glow value for selected state */
  glow: string;
}

const colorMap: Record<OsceNodeType, NodeColorScheme> = {
  storyboard: {
    border: 'var(--color-node-storyboard)',
    accent: 'rgba(148, 163, 184, 0.10)',
    glow: '0 0 8px rgba(148, 163, 184, 0.25), 0 0 16px rgba(148, 163, 184, 0.10)',
  },
  init: {
    border: 'var(--color-node-init)',
    accent: 'rgba(93, 216, 168, 0.10)',
    glow: '0 0 8px rgba(93, 216, 168, 0.25), 0 0 16px rgba(93, 216, 168, 0.10)',
  },
  entity: {
    border: 'var(--color-node-entity)',
    accent: 'rgba(136, 184, 232, 0.10)',
    glow: '0 0 8px rgba(136, 184, 232, 0.25), 0 0 16px rgba(136, 184, 232, 0.10)',
  },
  story: {
    border: 'var(--color-node-story)',
    accent: 'rgba(123, 136, 232, 0.10)',
    glow: '0 0 8px rgba(123, 136, 232, 0.25), 0 0 16px rgba(123, 136, 232, 0.10)',
  },
  act: {
    border: 'var(--color-node-act)',
    accent: 'rgba(155, 132, 232, 0.10)',
    glow: '0 0 8px rgba(155, 132, 232, 0.25), 0 0 16px rgba(155, 132, 232, 0.10)',
  },
  maneuverGroup: {
    border: 'var(--color-node-maneuver-group)',
    accent: 'rgba(184, 171, 235, 0.10)',
    glow: '0 0 8px rgba(184, 171, 235, 0.25), 0 0 16px rgba(184, 171, 235, 0.10)',
  },
  maneuver: {
    border: 'var(--color-node-maneuver)',
    accent: 'rgba(208, 198, 242, 0.10)',
    glow: '0 0 8px rgba(208, 198, 242, 0.25), 0 0 16px rgba(208, 198, 242, 0.10)',
  },
  event: {
    border: 'var(--color-node-event)',
    accent: 'rgba(232, 201, 66, 0.10)',
    glow: '0 0 8px rgba(232, 201, 66, 0.25), 0 0 16px rgba(232, 201, 66, 0.10)',
  },
  action: {
    border: 'var(--color-node-action)',
    accent: 'rgba(232, 160, 90, 0.10)',
    glow: '0 0 8px rgba(232, 160, 90, 0.25), 0 0 16px rgba(232, 160, 90, 0.10)',
  },
  trigger: {
    border: 'var(--color-node-trigger)',
    accent: 'rgba(232, 138, 138, 0.10)',
    glow: '0 0 8px rgba(232, 138, 138, 0.25), 0 0 16px rgba(232, 138, 138, 0.10)',
  },
  condition: {
    border: 'var(--color-node-condition)',
    accent: 'rgba(200, 180, 240, 0.10)',
    glow: '0 0 8px rgba(200, 180, 240, 0.25), 0 0 16px rgba(200, 180, 240, 0.10)',
  },
};

export function getNodeColor(nodeType: OsceNodeType): NodeColorScheme {
  return colorMap[nodeType];
}
