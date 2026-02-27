/**
 * Renders road ID and lane ID labels as HTML overlays using drei's Html component.
 * Labels are placed at the midpoint of each road/lane section.
 */

import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import type { OdrRoad } from '@osce/shared';
import { evaluateReferenceLineAtS, evaluateElevation, stToXyz, computeLaneInnerT, computeLaneOuterT } from '@osce/opendrive';

interface RoadLabelsProps {
  roads: OdrRoad[];
  showRoadIds: boolean;
  showLaneIds: boolean;
}

interface LabelData {
  key: string;
  text: string;
  position: [number, number, number];
}

export const RoadLabels: React.FC<RoadLabelsProps> = React.memo(
  ({ roads, showRoadIds, showLaneIds }) => {
    const labels = useMemo(() => {
      const result: LabelData[] = [];

      for (const road of roads) {
        const midS = road.length / 2;
        const pose = evaluateReferenceLineAtS(road.planView, midS);
        const z = evaluateElevation(road.elevationProfile, midS);

        if (showRoadIds) {
          const pos = stToXyz(pose, 0, z + 2);
          result.push({
            key: `road-${road.id}`,
            text: `Road ${road.id}`,
            position: [pos.x, pos.y, pos.z],
          });
        }

        if (showLaneIds) {
          // Find the lane section that covers midS
          let sectionIdx = 0;
          for (let i = 0; i < road.lanes.length; i++) {
            const sEnd = i + 1 < road.lanes.length ? road.lanes[i + 1].s : road.length;
            if (midS >= road.lanes[i].s && midS <= sEnd) {
              sectionIdx = i;
              break;
            }
          }
          const section = road.lanes[sectionIdx];
          const dsFromSection = midS - section.s;

          const allLanes = [...section.leftLanes, ...section.rightLanes];
          for (const lane of allLanes) {
            const innerT = computeLaneInnerT(section, lane, dsFromSection);
            const outerT = computeLaneOuterT(section, lane, dsFromSection);
            const t = (innerT + outerT) / 2;
            const lanePos = stToXyz(pose, t, z + 1);
            result.push({
              key: `lane-${road.id}-${lane.id}`,
              text: `${lane.id}`,
              position: [lanePos.x, lanePos.y, lanePos.z],
            });
          }
        }
      }
      return result;
    }, [roads, showRoadIds, showLaneIds]);

    if (labels.length === 0) return null;

    return (
      <group>
        {labels.map((label) => (
          <Html
            key={label.key}
            position={label.position}
            center
            occlude
            style={{
              fontSize: label.key.startsWith('road-') ? '12px' : '10px',
              color: label.key.startsWith('road-') ? '#FFD700' : '#00FFFF',
              backgroundColor: 'rgba(0,0,0,0.6)',
              padding: '2px 4px',
              borderRadius: '2px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {label.text}
          </Html>
        ))}
      </group>
    );
  },
);

RoadLabels.displayName = 'RoadLabels';
