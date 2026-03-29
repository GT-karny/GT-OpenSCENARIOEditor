/**
 * Renders a traffic light signal as a 3D box housing with a textured front face.
 *
 * All bulbs, overlays (arrows / pedestrian silhouettes), and glow effects
 * are baked onto a Canvas2D texture by signal-texture.ts and applied to
 * the front (+Z) face of a BoxGeometry. The remaining five faces use a
 * solid housing colour, giving the signal realistic depth from any angle.
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { SignalDescriptor } from '../../utils/signal-catalog.js';
import { getSignalTexture } from '../../utils/signal-texture.js';
import { getSharedBox } from '../../utils/shared-geometries.js';
import { TRAFFIC_LIGHT } from '../../utils/signal-geometry.js';

interface TrafficLightSignalProps {
  /** Signal descriptor from the catalog */
  descriptor: SignalDescriptor;
  /** Current active state string (e.g., "green", "on;off;off"). Undefined = all off. */
  activeState?: string;
}

/** Lazily-created singleton material shared by all housing side/back faces. */
let _housingMat: THREE.MeshBasicMaterial | null = null;
function getHousingMaterial(): THREE.MeshBasicMaterial {
  if (!_housingMat) {
    _housingMat = new THREE.MeshBasicMaterial({ color: TRAFFIC_LIGHT.housingColor });
  }
  return _housingMat;
}

export const TrafficLightSignal: React.FC<TrafficLightSignalProps> = React.memo(
  ({ descriptor, activeState }) => {
    const { housing } = descriptor;

    const isHoriz = descriptor.orientation === 'horizontal';
    const boxGeo = useMemo(
      () =>
        isHoriz
          ? getSharedBox(housing.width, housing.height, housing.depth)
          : getSharedBox(housing.height, housing.width, housing.depth),
      [housing.width, housing.height, housing.depth, isHoriz],
    );

    // BoxGeometry material groups: 0=+X, 1=-X, 2=+Y, 3=-Y, 4=+Z(front), 5=-Z(back)
    const materials = useMemo(() => {
      const tex = getSignalTexture(descriptor, activeState);
      const frontMat = new THREE.MeshBasicMaterial({ map: tex });
      const h = getHousingMaterial();
      return [h, h, h, h, frontMat, h];
    }, [descriptor, activeState]);

    const isHorizontal = isHoriz;
    // Vertical: PI/2 around Y; Horizontal: additionally -PI/2 around Z (red on left)
    const rotation: [number, number, number] = isHorizontal
      ? [0, Math.PI / 2, -Math.PI / 2]
      : [0, Math.PI / 2, 0];

    return (
      <mesh rotation={rotation} geometry={boxGeo} material={materials} />
    );
  },
);

TrafficLightSignal.displayName = 'TrafficLightSignal';
