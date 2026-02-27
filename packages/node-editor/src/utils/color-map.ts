/**
 * Node type to color mapping for visual differentiation.
 */

import type { OsceNodeType } from '../types/node-types.js';

export interface NodeColorScheme {
  bg: string;
  border: string;
  text: string;
  accent: string;
}

const colorMap: Record<OsceNodeType, NodeColorScheme> = {
  storyboard: { bg: 'bg-slate-50', border: 'border-slate-400', text: 'text-slate-800', accent: 'bg-slate-200' },
  init: { bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-800', accent: 'bg-emerald-200' },
  entity: { bg: 'bg-cyan-50', border: 'border-cyan-400', text: 'text-cyan-800', accent: 'bg-cyan-200' },
  story: { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-800', accent: 'bg-blue-200' },
  act: { bg: 'bg-indigo-50', border: 'border-indigo-400', text: 'text-indigo-800', accent: 'bg-indigo-200' },
  maneuverGroup: { bg: 'bg-violet-50', border: 'border-violet-400', text: 'text-violet-800', accent: 'bg-violet-200' },
  maneuver: { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-800', accent: 'bg-purple-200' },
  event: { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-800', accent: 'bg-amber-200' },
  action: { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-800', accent: 'bg-orange-200' },
  trigger: { bg: 'bg-rose-50', border: 'border-rose-400', text: 'text-rose-800', accent: 'bg-rose-200' },
  condition: { bg: 'bg-pink-50', border: 'border-pink-400', text: 'text-pink-800', accent: 'bg-pink-200' },
};

export function getNodeColor(nodeType: OsceNodeType): NodeColorScheme {
  return colorMap[nodeType];
}
