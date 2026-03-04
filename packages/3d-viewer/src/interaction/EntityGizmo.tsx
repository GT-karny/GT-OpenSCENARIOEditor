/**
 * Wraps drei's TransformControls to provide gizmo-based entity manipulation.
 * Handles coordinate conversion between Three.js and OpenSCENARIO coordinate systems.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { TransformControls } from '@react-three/drei';
import type * as THREE from 'three';
import type { GizmoMode } from '../store/viewer-types.js';

interface EntityGizmoProps {
  /** The Three.js object to attach the gizmo to */
  object: React.RefObject<THREE.Object3D | null>;
  /** Gizmo mode: translate or rotate */
  mode: Exclude<GizmoMode, 'off'>;
  /** Reference to OrbitControls (disabled during gizmo drag) */
  orbitControlsRef?: React.RefObject<any>;
  /** Called when drag ends with new position in OpenSCENARIO world coordinates */
  onDragEnd?: (worldX: number, worldY: number, worldZ: number, heading: number) => void;
}

/**
 * Convert Three.js local position/rotation (inside the rotation group [-π/2, 0, 0])
 * back to OpenSCENARIO world coordinates.
 *
 * The EntityGroup applies `rotation={[-π/2, 0, 0]}` which maps:
 *   Three.js (x, y, z) → OpenSCENARIO (x, -z, y)
 * Inverse:
 *   OpenSCENARIO (x, y, z) ← Three.js (x, z, -y)
 * But entities are placed at [pos.x, pos.y, pos.z] with rotation [0, 0, pos.h]
 * where pos is already in the rotated frame. So:
 *   osce.x = three.x, osce.y = -three.z (wait, let me re-check)
 *
 * Looking at EntityGroup: position={[pos.x, pos.y, pos.z]} rotation={[0, 0, pos.h]}
 * where pos = WorldCoords {x, y, z, h} from position-resolver.
 * The resolver returns: { x: worldPos.x, y: worldPos.y, z: worldPos.z, h: pose.hdg }
 * These are OpenDRIVE coords placed inside the rotation group.
 *
 * The rotation group [-π/2, 0, 0] rotates the Y-up Three.js world to Z-up OpenDRIVE.
 * Inside the group: the local coordinate system has Z pointing up.
 * So the entity's local position directly maps to OpenSCENARIO (x, y, z).
 *
 * After gizmo drag: object.position gives local coords inside the group = OSCE coords.
 */
export const EntityGizmo: React.FC<EntityGizmoProps> = React.memo(
  ({ object, mode, orbitControlsRef, onDragEnd }) => {
    const controlsRef = useRef<any>(null);

    // Disable OrbitControls while dragging the gizmo
    useEffect(() => {
      const controls = controlsRef.current;
      if (!controls) return;

      const handleDraggingChanged = (event: { value: boolean }) => {
        if (orbitControlsRef?.current) {
          orbitControlsRef.current.enabled = !event.value;
        }
      };

      controls.addEventListener('dragging-changed', handleDraggingChanged);
      return () => {
        controls.removeEventListener('dragging-changed', handleDraggingChanged);
      };
    }, [orbitControlsRef]);

    // Handle drag end — extract new position/rotation and notify parent
    const handleMouseUp = useCallback(() => {
      if (!object.current || !onDragEnd) return;

      const obj = object.current;
      // Position inside the rotation group = OpenSCENARIO world coords
      const x = obj.position.x;
      const y = obj.position.y;
      const z = obj.position.z;
      // Heading from Z-axis rotation (inside the rotated group)
      const h = obj.rotation.z;

      onDragEnd(x, y, z, h);
    }, [object, onDragEnd]);

    useEffect(() => {
      const controls = controlsRef.current;
      if (!controls) return;

      controls.addEventListener('mouseUp', handleMouseUp);
      return () => {
        controls.removeEventListener('mouseUp', handleMouseUp);
      };
    }, [handleMouseUp]);

    if (!object.current) return null;

    return (
      <TransformControls
        ref={controlsRef}
        object={object.current}
        mode={mode}
        size={0.8}
        // Only translate on X/Y plane (Z is up in the rotated group)
        showZ={mode === 'translate' ? false : true}
      />
    );
  },
);

EntityGizmo.displayName = 'EntityGizmo';
