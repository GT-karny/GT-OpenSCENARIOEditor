/**
 * Authored road-object visualization (OpenDRIVE `<object>`).
 *
 * Minimal, read-only geometry for every `road.objects` entry: a box
 * (length×width×height), a cylinder (radius), or a small fallback cube, placed
 * on the road surface via the object-position resolver. `<repeat>` entries with
 * a positive distance expand into evenly spaced instances (capped).
 *
 * Rendered with plain meshes (correctness over draw-call count — object counts
 * are small and this is minimal viz). Coordinates are produced in the OpenDRIVE
 * z-up frame, so the whole group is wrapped in RoadNetwork's z-up → y-up
 * rotation, matching TrafficSignalGroup.
 *
 * Out of P3 scope: outlines/materials fidelity, tunnels, and bridges.
 */

import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import type { OpenDriveDocument } from '@osce/shared';
import { resolveObjectPose, resolveObjectPosition } from '../utils/object-position-resolver.js';
import {
  selectObjectGeometry,
  expandObjectRepeat,
  type ObjectGeometryKind,
} from './road-object-geometry.js';

interface RoadObjectsGroupProps {
  openDriveDocument: OpenDriveDocument | null;
}

/** Semi-transparent neutral body shared by all object meshes. */
const OBJECT_MATERIAL = new THREE.MeshStandardMaterial({
  color: '#8899aa',
  roughness: 0.85,
  transparent: true,
  opacity: 0.55,
  depthWrite: false,
  side: THREE.DoubleSide,
});

/** Subtle edge line to give the translucent volumes a readable silhouette. */
const OBJECT_EDGE_MATERIAL = new THREE.LineBasicMaterial({
  color: '#c8d4e4',
  transparent: true,
  opacity: 0.5,
  depthWrite: false,
});

interface ObjectRenderItem {
  key: string;
  geometry: THREE.BufferGeometry;
  edges: THREE.BufferGeometry;
  position: [number, number, number];
  rotation: [number, number, number];
  /** Local +z lift so the geometry's base rests on the surface. */
  offsetZ: number;
}

/** Build a body geometry (axis-corrected for the ODR z-up frame) for a kind. */
function buildKindGeometry(kind: ObjectGeometryKind): { geom: THREE.BufferGeometry; offsetZ: number } {
  switch (kind.kind) {
    case 'box':
      return { geom: new THREE.BoxGeometry(kind.length, kind.width, kind.height), offsetZ: kind.height / 2 };
    case 'cylinder': {
      const geom = new THREE.CylinderGeometry(kind.radius, kind.radius, kind.height, 16);
      geom.rotateX(Math.PI / 2); // default Y axis → Z (ODR up)
      return { geom, offsetZ: kind.height / 2 };
    }
    case 'cube':
      return { geom: new THREE.BoxGeometry(kind.size, kind.size, kind.size), offsetZ: kind.size / 2 };
  }
}

export const RoadObjectsGroup: React.FC<RoadObjectsGroupProps> = React.memo(
  ({ openDriveDocument }) => {
    const items = useMemo(() => {
      if (!openDriveDocument) return [];

      const out: ObjectRenderItem[] = [];

      for (const road of openDriveDocument.roads) {
        for (let oi = 0; oi < road.objects.length; oi++) {
          const obj = road.objects[oi];
          const kind = selectObjectGeometry(obj);
          const idKey = `${road.id}:${obj.id || oi}`;

          // Collect the world poses for this object (single, or repeat-expanded).
          const poses: Array<{ suffix: string; pose: ReturnType<typeof resolveObjectPosition> }> = [];

          const repeats = obj.repeat?.filter((r) => r.distance > 0) ?? [];
          if (repeats.length > 0) {
            for (let ri = 0; ri < repeats.length; ri++) {
              const { instances, clamped } = expandObjectRepeat(repeats[ri]);
              if (clamped) {
                console.warn(
                  `RoadObjectsGroup: repeat for object ${idKey} exceeded the instance cap; clamped.`,
                );
              }
              for (let ii = 0; ii < instances.length; ii++) {
                const inst = instances[ii];
                poses.push({
                  suffix: `r${ri}-${ii}`,
                  pose: resolveObjectPose(road, inst.s, inst.t, inst.zOffset, obj.hdg ?? 0, obj.pitch ?? 0, obj.roll ?? 0),
                });
              }
            }
          } else {
            poses.push({ suffix: 'base', pose: resolveObjectPosition(obj, road) });
          }

          for (const { suffix, pose } of poses) {
            if (!pose) continue;
            const { geom, offsetZ } = buildKindGeometry(kind);
            out.push({
              key: `${idKey}:${suffix}`,
              geometry: geom,
              edges: new THREE.EdgesGeometry(geom),
              position: [pose.x, pose.y, pose.z],
              rotation: [pose.pitch ?? 0, pose.roll ?? 0, pose.h],
              offsetZ,
            });
          }
        }
      }

      return out;
    }, [openDriveDocument]);

    // Dispose the geometries created above when the list changes or on unmount.
    useEffect(() => {
      return () => {
        for (const item of items) {
          item.geometry.dispose();
          item.edges.dispose();
        }
      };
    }, [items]);

    if (items.length === 0) return null;

    return (
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {items.map((item) => (
          <group key={item.key} position={item.position} rotation={item.rotation}>
            <mesh
              geometry={item.geometry}
              material={OBJECT_MATERIAL}
              position={[0, 0, item.offsetZ]}
            />
            <lineSegments
              geometry={item.edges}
              material={OBJECT_EDGE_MATERIAL}
              position={[0, 0, item.offsetZ]}
            />
          </group>
        ))}
      </group>
    );
  },
);

RoadObjectsGroup.displayName = 'RoadObjectsGroup';
