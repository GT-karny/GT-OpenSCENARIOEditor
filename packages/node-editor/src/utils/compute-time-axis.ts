/**
 * Pure utility to compute time axis configuration for the timeline ruler.
 */

export interface TimeAxisTick {
  /** Time in seconds */
  time: number;
  /** Pixel offset from left edge of the event area */
  x: number;
  /** Display label (e.g. "5s") */
  label: string;
}

export interface TimeAxisConfig {
  /** Maximum time value displayed on the axis (rounded up with padding) */
  maxTime: number;
  /** Interval between tick marks in seconds */
  tickInterval: number;
  /** Total width in pixels for the event area */
  totalWidth: number;
  /** Array of tick positions */
  ticks: TimeAxisTick[];
}

/**
 * Computes time axis configuration from timeline track data.
 *
 * @param tracks - Array of track-like objects containing events with startTime
 * @param pixelsPerSecond - Horizontal scale factor
 * @returns TimeAxisConfig with ticks, interval, and dimensions
 */
export function computeTimeAxisConfig(
  tracks: ReadonlyArray<{ events: ReadonlyArray<{ startTime: number | null }> }>,
  pixelsPerSecond: number,
): TimeAxisConfig {
  const allTimes = tracks.flatMap((t) =>
    t.events
      .map((e) => e.startTime)
      .filter((s): s is number => s != null),
  );

  const rawMax = allTimes.length > 0 ? Math.max(...allTimes) : 0;
  const displayMax = Math.max(10, rawMax);

  const tickInterval = displayMax <= 20 ? 1 : displayMax <= 60 ? 5 : 10;

  // Ensure right padding accommodates the minimum event width (80px)
  const MIN_EVENT_WIDTH_PX = 80;
  const minPaddingSeconds = MIN_EVENT_WIDTH_PX / pixelsPerSecond;
  const tickPadding = Math.max(
    tickInterval,
    Math.ceil(minPaddingSeconds / tickInterval) * tickInterval,
  );
  const maxTime =
    Math.ceil(displayMax / tickInterval) * tickInterval + tickPadding;

  const ticks: TimeAxisTick[] = [];
  for (let t = 0; t <= maxTime; t += tickInterval) {
    ticks.push({
      time: t,
      x: t * pixelsPerSecond,
      label: `${t}s`,
    });
  }

  return {
    maxTime,
    tickInterval,
    totalWidth: maxTime * pixelsPerSecond,
    ticks,
  };
}
