/**
 * Shared geometry cache for traffic signal rendering.
 * Lazily creates and reuses geometries by dimension key to avoid GPU memory bloat.
 */

import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Sphere cache (for bulb lenses)
// ---------------------------------------------------------------------------

const sphereCache = new Map<string, THREE.SphereGeometry>();

export function getSharedSphere(radius: number, wSeg = 10, hSeg = 8): THREE.SphereGeometry {
  const key = `${radius}:${wSeg}:${hSeg}`;
  let geo = sphereCache.get(key);
  if (!geo) {
    geo = new THREE.SphereGeometry(radius, wSeg, hSeg);
    sphereCache.set(key, geo);
  }
  return geo;
}

// ---------------------------------------------------------------------------
// Box cache (for signal housings)
// ---------------------------------------------------------------------------

const boxCache = new Map<string, THREE.BoxGeometry>();

export function getSharedBox(width: number, height: number, depth: number): THREE.BoxGeometry {
  const key = `${width}:${height}:${depth}`;
  let geo = boxCache.get(key);
  if (!geo) {
    geo = new THREE.BoxGeometry(width, height, depth);
    boxCache.set(key, geo);
  }
  return geo;
}

// ---------------------------------------------------------------------------
// Cylinder cache (for poles)
// ---------------------------------------------------------------------------

const cylinderCache = new Map<string, THREE.CylinderGeometry>();

export function getSharedCylinder(
  radius: number,
  height: number,
  segments = 8,
): THREE.CylinderGeometry {
  const key = `${radius}:${height}:${segments}`;
  let geo = cylinderCache.get(key);
  if (!geo) {
    geo = new THREE.CylinderGeometry(radius, radius, height, segments);
    cylinderCache.set(key, geo);
  }
  return geo;
}

// ---------------------------------------------------------------------------
// Circle cache (for pedestrian head circles)
// ---------------------------------------------------------------------------

const circleCache = new Map<string, THREE.CircleGeometry>();

export function getSharedCircle(radius: number, segments = 12): THREE.CircleGeometry {
  const key = `${radius}:${segments}`;
  let geo = circleCache.get(key);
  if (!geo) {
    geo = new THREE.CircleGeometry(radius, segments);
    circleCache.set(key, geo);
  }
  return geo;
}

// ---------------------------------------------------------------------------
// Plane cache (for textured signal faces)
// ---------------------------------------------------------------------------

const planeCache = new Map<string, THREE.PlaneGeometry>();

export function getSharedPlane(width: number, height: number): THREE.PlaneGeometry {
  const key = `${width}:${height}`;
  let geo = planeCache.get(key);
  if (!geo) {
    geo = new THREE.PlaneGeometry(width, height);
    planeCache.set(key, geo);
  }
  return geo;
}
