/**
 * APEX Glass Material — MeshStandardMaterial with Fresnel rim glow.
 *
 * Injects a Fresnel-based edge glow into the standard PBR pipeline,
 * tinted with the APEX accent purple. The rim intensifies near the
 * cursor world position (shared via apex-cursor module).
 */

import React, { useRef, useMemo } from 'react';
import { MeshStandardMaterial, Color, Vector3 } from 'three';

/** Shader object passed to onBeforeCompile */
interface ShaderObject {
  uniforms: Record<string, { value: unknown }>;
  vertexShader: string;
  fragmentShader: string;
}
import { useFrame } from '@react-three/fiber';
import { cursorWorldPos } from '../utils/apex-cursor.js';

/** APEX accent purple for rim glow */
const RIM_COLOR = new Color('#9B84E8');

interface ApexGlassMaterialProps {
  color: string;
  transparent?: boolean;
  opacity?: number;
  emissive?: string;
  emissiveIntensity?: number;
  /** Base rim intensity when cursor is far away (0..1) */
  rimBase?: number;
  /** Peak rim intensity when cursor is nearby (0..1) */
  rimPeak?: number;
  /** Fresnel power — higher = thinner rim line */
  rimPower?: number;
  /** Radius within which cursor boosts the rim (world units) */
  cursorRadius?: number;
}

// Vertex: pass world position to fragment via varying
const VERT_PREAMBLE = /* glsl */ `
varying vec3 vApexWorldPos;
`;
const VERT_INJECT = /* glsl */ `
vApexWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
`;

// Fragment: compute Fresnel rim and add to totalEmissiveRadiance
const FRAG_PREAMBLE = /* glsl */ `
varying vec3 vApexWorldPos;
uniform vec3 uApexRimColor;
uniform vec3 uApexCursorPos;
uniform float uApexRimBase;
uniform float uApexRimPeak;
uniform float uApexRimPower;
uniform float uApexCursorRadius;
`;
// Inject AFTER emissivemap_fragment (normal + totalEmissiveRadiance ready)
// `normal` is in VIEW space in MeshStandardMaterial, so use `vViewPosition`
// (view-space vector from fragment to camera) for a correct Fresnel dot product.
const FRAG_INJECT = /* glsl */ `
{
  vec3 apexViewDir = normalize(vViewPosition);
  float apexNdotV = abs(dot(apexViewDir, normal));
  float apexFresnel = pow(clamp(1.0 - apexNdotV, 0.0, 1.0), uApexRimPower);
  float apexCursorDist = distance(vApexWorldPos.xz, uApexCursorPos.xz);
  float apexCursorFactor = smoothstep(uApexCursorRadius, 0.0, apexCursorDist);
  float apexRimStrength = mix(uApexRimBase, uApexRimPeak, apexCursorFactor);
  totalEmissiveRadiance += uApexRimColor * apexFresnel * apexRimStrength;
}
`;

export const ApexGlassMaterial: React.FC<ApexGlassMaterialProps> = ({
  color,
  transparent,
  opacity,
  emissive,
  emissiveIntensity,
  rimBase = 0.15,
  rimPeak = 0.8,
  rimPower = 3.0,
  cursorRadius = 40,
}) => {
  const shaderRef = useRef<ShaderObject | null>(null);

  const material = useMemo(() => {
    const mat = new MeshStandardMaterial();

    mat.onBeforeCompile = (shader) => {
      // Custom uniforms
      shader.uniforms.uApexRimColor = { value: RIM_COLOR.clone() };
      shader.uniforms.uApexCursorPos = { value: new Vector3() };
      shader.uniforms.uApexRimBase = { value: rimBase };
      shader.uniforms.uApexRimPeak = { value: rimPeak };
      shader.uniforms.uApexRimPower = { value: rimPower };
      shader.uniforms.uApexCursorRadius = { value: cursorRadius };

      shaderRef.current = shader;

      // --- Vertex shader ---
      shader.vertexShader = VERT_PREAMBLE + shader.vertexShader;
      // Inject after #include <begin_vertex> where `transformed` is available
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\n' + VERT_INJECT,
      );

      // --- Fragment shader ---
      shader.fragmentShader = FRAG_PREAMBLE + shader.fragmentShader;
      // Inject after emissivemap_fragment (totalEmissiveRadiance is set, normal is available)
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\n' + FRAG_INJECT,
      );
    };

    mat.customProgramCacheKey = () => 'apex-glass-v1';
    return mat;
    // Intentionally no deps — material is created once, updated via .set() below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync React props → material properties every render
  material.color.set(color);
  material.transparent = transparent ?? false;
  material.opacity = opacity ?? 1;
  material.emissive.set(emissive ?? '#000000');
  material.emissiveIntensity = emissiveIntensity ?? 0;
  material.needsUpdate = true;

  // Update cursor position uniform every frame
  useFrame(() => {
    const s = shaderRef.current;
    if (s) {
      (s.uniforms.uApexCursorPos.value as Vector3).copy(cursorWorldPos);
    }
  });

  return <primitive object={material} attach="material" />;
};

ApexGlassMaterial.displayName = 'ApexGlassMaterial';
