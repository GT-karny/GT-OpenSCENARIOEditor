/**
 * Renders road ID and lane ID labels as HTML overlays using drei's Html component.
 * Labels are placed at the midpoint of each road/lane section.
 */

import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import type { OdrRoad } from '@osce/shared';
import { evaluateReferenceLineAtS, evaluateElevation, evaluateLaneOffset, computeLaneInnerT, computeLaneOuterT } from '@osce/opendrive';
import { bankedSurfacePoint } from '../utils/banked-surface.js';

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
          // Bank the reference point, then keep the +2m label lift on top.
          const surf = bankedSurfacePoint(road, pose, midS, 0, z);
          result.push({
            key: `road-${road.id}`,
            text: `Road ${road.id}`,
            position: [surf.x, surf.y, surf.z + 2],
          });
        }

        if (showLaneIds) {
          // Show lane IDs at the midpoint of each lane section so that
          // lanes added by taper/split operations are always visible.
          for (let i = 0; i < road.lanes.length; i++) {
            const section = road.lanes[i];
            const sEnd = i + 1 < road.lanes.length ? road.lanes[i + 1].s : road.length;
            const secMidS = (section.s + sEnd) / 2;
            const dsFromSection = secMidS - section.s;

            const secPose = evaluateReferenceLineAtS(road.planView, secMidS);
            const secZ = evaluateElevation(road.elevationProfile, secMidS);
            const laneOff = evaluateLaneOffset(road.laneOffset, secMidS);

            const allLanes = [...section.leftLanes, ...section.rightLanes];
            for (const lane of allLanes) {
              const innerT = computeLaneInnerT(section, lane, dsFromSection) + laneOff;
              const outerT = computeLaneOuterT(section, lane, dsFromSection) + laneOff;
              const t = (innerT + outerT) / 2;
              // Bank the lane point, then keep the +1m label lift on top.
              const surf = bankedSurfacePoint(road, secPose, secMidS, t, secZ);
              result.push({
                key: `lane-${road.id}-s${i}-${lane.id}`,
                text: `${lane.id}`,
                position: [surf.x, surf.y, surf.z + 1],
              });
            }
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
