/**
 * Shared cursor world-position state.
 * Updated by CursorLight3D in SceneEnvironment, read by ApexGlassMaterial.
 */

import { Vector3 } from 'three';

/** World-space position of the cursor on the ground plane (Y=0). */
export const cursorWorldPos = new Vector3(0, 0, 0);
