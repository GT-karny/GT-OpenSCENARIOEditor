/**
 * Hook that seeks the simulation playback to the start of an element's
 * "running" interval when clicked in the Composer panel.
 * Only active when simulation is in 'completed' state.
 */

import { useCallback, useMemo } from 'react';
import { useSimulationStore } from '../stores/simulation-store';
import { useScenarioStoreApi } from '../stores/use-scenario-store';
import { buildIdToFullPathMap, getRunningIntervals } from '../lib/fullpath-mapping';

export function useSeekToElement() {
  const status = useSimulationStore((s) => s.status);
  const frames = useSimulationStore((s) => s.frames);
  const storyBoardEvents = useSimulationStore((s) => s.storyBoardEvents);
  const scenarioStoreApi = useScenarioStoreApi();

  const idToFullPath = useMemo(() => {
    if (storyBoardEvents.length === 0) return new Map<string, string>();
    return buildIdToFullPathMap(scenarioStoreApi.getState().document);
  }, [storyBoardEvents, scenarioStoreApi]);

  const totalTime = frames.length > 0 ? (frames[frames.length - 1]?.time ?? 0) : 0;

  const seekToElement = useCallback(
    (elementId: string) => {
      if (status !== 'completed' || frames.length === 0) return;

      const fullPath = idToFullPath.get(elementId);
      if (!fullPath) return;

      const intervals = getRunningIntervals(storyBoardEvents, fullPath, totalTime);
      if (intervals.length === 0) return;

      // Seek to the start of the first running interval
      const targetTime = intervals[0].start;
      let bestIdx = 0;
      for (let i = 1; i < frames.length; i++) {
        if (Math.abs(frames[i].time - targetTime) < Math.abs(frames[bestIdx].time - targetTime)) {
          bestIdx = i;
        }
      }
      useSimulationStore.getState().seekTo(bestIdx);
    },
    [status, frames, storyBoardEvents, idToFullPath, totalTime],
  );

  return seekToElement;
}
