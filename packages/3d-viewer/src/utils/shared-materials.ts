/**
 * Shared material cache for traffic signal rendering.
 * Pools MeshStandardMaterial instances by their visual parameters.
 * Signal bulbs have a small set of distinct color combinations (red/yellow/green × on/off).
 */

import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Standard material cache
// ---------------------------------------------------------------------------

interface StandardMaterialParams {
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  roughness?: number;
  transparent?: boolean;
  opacity?: number;
  depthWrite?: boolean;
  depthTest?: boolean;
  side?: THREE.Side;
}

const standardCache = new Map<string, THREE.MeshStandardMaterial>();

function buildKey(params: StandardMaterialParams): string {
  return `${params.color}|${params.emissive ?? ''}|${params.emissiveIntensity ?? 0}|${params.roughness ?? 0.5}|${params.transparent ? 1 : 0}|${params.opacity ?? 1}|${params.depthWrite ?? true ? 1 : 0}|${params.depthTest ?? true ? 1 : 0}|${params.side ?? THREE.FrontSide}`;
}

export function getSharedStandardMaterial(params: StandardMaterialParams): THREE.MeshStandardMaterial {
  const key = buildKey(params);
  let mat = standardCache.get(key);
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({
      color: params.color,
      emissive: params.emissive,
      emissiveIntensity: params.emissiveIntensity,
      roughness: params.roughness,
      transparent: params.transparent,
      opacity: params.opacity,
      depthWrite: params.depthWrite,
      depthTest: params.depthTest,
      side: params.side,
    });
    standardCache.set(key, mat);
  }
  return mat;
}
