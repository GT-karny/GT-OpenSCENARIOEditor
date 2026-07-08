/**
 * Maps OpenDRIVE lane types to display colors for 3D rendering.
 */

const LANE_COLORS: Record<string, string> = {
  driving: '#808080',
  shoulder: '#606060',
  border: '#404040',
  stop: '#A0A000',
  parking: '#4060A0',
  sidewalk: '#C8B070',
  curb: '#505050',
  biking: '#806040',
  entry: '#707070',
  exit: '#707070',
  onRamp: '#707070',
  offRamp: '#707070',
  median: '#305030',
  restricted: '#303030',
  none: '#303030',
  bus: '#708090',
  taxi: '#708090',
  hov: '#708090',
  connectingRamp: '#707070',
  bidirectional: '#808080',
  special1: '#505050',
  special2: '#505050',
  special3: '#505050',
  roadWorks: '#CC8800',
  tram: '#604060',
  rail: '#604060',
  // Shared by all traffic participants — a blend of biking (cyclist) and
  // sidewalk (pedestrian) tones, the two modes it's most often shared between.
  shared: '#A48858',
  // 1.9 prefers `walking` over the deprecated `sidewalk` type; kept in the
  // same tan family so old and new documents read as the same lane kind.
  walking: '#C8A868',
  // Driving-lane variant (lets a driver bypass the main intersection); a warm
  // gray distinct from both plain driving and the entry/exit ramp family.
  slipLane: '#8C8868',
};

const DEFAULT_LANE_COLOR = '#606060';

/**
 * Get the display color for a given OpenDRIVE lane type.
 * @param laneType - The OdrLaneType string (e.g. 'driving', 'sidewalk')
 * @returns Hex color string (e.g. '#808080')
 */
export function getLaneColor(laneType: string): string {
  return LANE_COLORS[laneType] ?? DEFAULT_LANE_COLOR;
}
