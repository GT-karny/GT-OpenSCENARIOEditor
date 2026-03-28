/**
 * APEX Edge Glow — thick edge lines that react to cursor proximity & direction.
 *
 * Translates the APEX 2D "hot light" (::after mask trick) into 3D:
 * - EdgesGeometry extracts actual geometric edges (box edges, cylinder rims)
 * - Line2 (GPU thick lines) renders them with configurable pixel width
 * - LineMaterial's fragment shader is patched to add cursor-reactive gradient
 *   matching the 2D hot-light rose-lavender color stops
 *
 * Selection / hover states override via props (falls back to drei Outlines).
 *
 * Must be placed as a child of a <mesh>.
 */

import React, { useRef, useCallback, useMemo, useState } from 'react';
import { Outlines } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Object3D, Mesh } from 'three';
import { EdgesGeometry, Vector3 } from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { cursorWorldPos } from '../utils/apex-cursor.js';

const CURSOR_RADIUS = 40;
const LINE_WIDTH = 0.06; // world units (~6cm)

interface ApexEdgeGlowProps {
  /** Override color (e.g. selection yellow, hover cyan). Disables cursor glow. */
  overrideColor?: string;
  /** Override thickness. Only used when overrideColor is set. */
  overrideThickness?: number;
}

// ---------------------------------------------------------------------------
// Patched LineMaterial: inject cursor-reactive hot-light gradient
// ---------------------------------------------------------------------------

// VERTEX SHADER patches — add a true world-space varying.
// LineMaterial's "worldPos" is actually in VIEW space (modelViewMatrix), not world space.
// We compute the real world position using modelMatrix instead.
const CURSOR_VERT_PREAMBLE = /* glsl */ `
varying vec3 vApexWorldPos;
`;

// Inject right after the line: vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );
const CURSOR_VERT_INJECT = /* glsl */ `
  {
    vec4 apexWS = modelMatrix * vec4( position.y < 0.5 ? instanceStart : instanceEnd, 1.0 );
    vApexWorldPos = apexWS.xyz;
  }
`;

// FRAGMENT SHADER patches
const CURSOR_FRAG_PREAMBLE = /* glsl */ `
varying vec3 vApexWorldPos;
uniform vec3 uCursorPos;
uniform float uCursorRadius;

// APEX hot-light — saturated lavender-purple gradient, no white
const vec3 HOT_CORE   = vec3(0.72, 0.52, 0.91);  // #B885E8 vivid lavender
const vec3 HOT_INNER  = vec3(0.61, 0.42, 0.85);  // #9C6BD9 mid lavender
const vec3 HOT_OUTER  = vec3(0.50, 0.35, 0.75);  // #8059BF deep lavender
const vec3 AMBIENT    = vec3(0.38, 0.28, 0.58);  // #614794 dark purple
`;

// Replace the final color output with cursor-gradient logic
const CURSOR_FRAG_REPLACE = /* glsl */ `
  // Cursor-reactive hot-light gradient using true world-space position
  float cursorDist = distance(vApexWorldPos.xz, uCursorPos.xz);
  float ct = clamp(cursorDist / uCursorRadius, 0.0, 1.0);

  vec3 hotCol;
  float hotAlpha;
  if (ct < 0.08) {
    // Core: bright lavender
    float f = ct / 0.08;
    hotCol = mix(HOT_CORE, HOT_INNER, f);
    hotAlpha = mix(0.85, 0.6, f);
  } else if (ct < 0.30) {
    // Inner: rose-lavender → mid lavender
    float f = (ct - 0.08) / 0.22;
    hotCol = mix(HOT_INNER, HOT_OUTER, f);
    hotAlpha = mix(0.6, 0.3, f);
  } else if (ct < 1.0) {
    // Outer: mid lavender → muted purple
    float f = (ct - 0.30) / 0.70;
    hotCol = mix(HOT_OUTER, AMBIENT, f);
    hotAlpha = mix(0.3, 0.10, f);
  } else {
    hotCol = AMBIENT;
    hotAlpha = 0.10;
  }

  gl_FragColor = vec4(hotCol, alpha * hotAlpha);
`;

/** Ref to compiled shader for per-frame uniform updates */
interface ShaderRef {
  uniforms: Record<string, { value: unknown }>;
}

function createApexLineMaterial(shaderRef: React.MutableRefObject<ShaderRef | null>): LineMaterial {
  const mat = new LineMaterial({
    color: 0x9b84e8,
    linewidth: LINE_WIDTH,
    worldUnits: true, // enables worldPos vec4 varying in fragment shader
    transparent: true,
    depthWrite: false,
    depthTest: true,
    opacity: 1,
  });

  // Patch both vertex + fragment shaders at compile time
  mat.onBeforeCompile = (shader) => {
    // Add cursor uniforms
    shader.uniforms.uCursorPos = { value: new Vector3() };
    shader.uniforms.uCursorRadius = { value: CURSOR_RADIUS };

    // Store ref for per-frame uniform updates
    shaderRef.current = shader as unknown as ShaderRef;

    // --- VERTEX SHADER: add true world-space varying ---
    shader.vertexShader = CURSOR_VERT_PREAMBLE + shader.vertexShader;
    // Inject after: vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );
    shader.vertexShader = shader.vertexShader.replace(
      /vec4 end\s*=\s*modelViewMatrix \* vec4\(\s*instanceEnd\s*,\s*1\.0\s*\)\s*;/,
      'vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );\n' + CURSOR_VERT_INJECT,
    );

    // --- FRAGMENT SHADER: cursor-reactive gradient ---
    shader.fragmentShader = CURSOR_FRAG_PREAMBLE + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      /gl_FragColor\s*=\s*vec4\(\s*diffuseColor\.rgb\s*,\s*alpha\s*\)\s*;/,
      CURSOR_FRAG_REPLACE,
    );
  };

  // Unique cache key so our patched shader doesn't conflict with unpatched LineMaterial
  mat.customProgramCacheKey = () => 'apex-edge-glow-v1';

  return mat;
}

// ---------------------------------------------------------------------------
// Helper: extract edge positions from EdgesGeometry as flat Float32Array
// ---------------------------------------------------------------------------

function edgesToPositions(edges: EdgesGeometry): Float32Array {
  const posAttr = edges.getAttribute('position');
  const arr = new Float32Array(posAttr.count * 3);
  for (let i = 0; i < posAttr.count; i++) {
    arr[i * 3] = posAttr.getX(i);
    arr[i * 3 + 1] = posAttr.getY(i);
    arr[i * 3 + 2] = posAttr.getZ(i);
  }
  return arr;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ApexEdgeGlow: React.FC<ApexEdgeGlowProps> = React.memo(
  ({ overrideColor, overrideThickness }) => {
    const parentRef = useRef<Object3D | null>(null);
    const shaderRef = useRef<ShaderRef | null>(null);
    const material = useMemo(() => createApexLineMaterial(shaderRef), []);
    const [lineSegments, setLineSegments] = useState<LineSegments2 | null>(null);

    // Capture parent mesh geometry via callback ref
    const probeCallback = useCallback((node: Object3D | null) => {
      if (!node?.parent) return;
      parentRef.current = node.parent;

      const parentMesh = node.parent as Mesh;
      if (parentMesh.geometry) {
        const edges = new EdgesGeometry(parentMesh.geometry, 15);
        const positions = edgesToPositions(edges);

        const geom = new LineSegmentsGeometry();
        geom.setPositions(positions);

        const segments = new LineSegments2(geom, material);
        segments.computeLineDistances();
        setLineSegments(segments);
      }
    }, [material]);

    // Update cursor uniform every frame via compiled shader ref
    useFrame(() => {
      if (overrideColor || !shaderRef.current) return;
      (shaderRef.current.uniforms.uCursorPos.value as Vector3).copy(cursorWorldPos);
    });

    // Override mode: use drei Outlines
    if (overrideColor) {
      return (
        <>
          <group ref={probeCallback} />
          <Outlines thickness={overrideThickness ?? 0.08} color={overrideColor} />
        </>
      );
    }

    return (
      <>
        <group ref={probeCallback} />
        {lineSegments && <primitive object={lineSegments} renderOrder={1} />}
      </>
    );
  },
);

ApexEdgeGlow.displayName = 'ApexEdgeGlow';
