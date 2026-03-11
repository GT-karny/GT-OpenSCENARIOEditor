/**
 * Displays WebGL renderer stats (draw calls, triangles, textures) as an
 * HTML overlay. Uses useFrame to read gl.info every 30 frames (~0.5s).
 */

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';

export function GLInfo() {
  const { gl } = useThree();
  const divRef = useRef<HTMLDivElement | null>(null);
  const frameCount = useRef(0);

  // Create a DOM overlay once
  useEffect(() => {
    const container = gl.domElement.parentElement;
    if (!container) return;

    const div = document.createElement('div');
    div.style.cssText =
      'position:absolute;bottom:52px;left:0;padding:4px 8px;' +
      'background:rgba(0,0,0,0.75);color:#0f0;font:11px monospace;' +
      'pointer-events:none;z-index:10;white-space:pre;line-height:1.4;';
    container.style.position = 'relative';
    container.appendChild(div);
    divRef.current = div;

    return () => {
      div.remove();
      divRef.current = null;
    };
  }, [gl]);

  // Update text every 30 frames
  useFrame(() => {
    frameCount.current++;
    if (frameCount.current % 30 !== 0) return;
    if (!divRef.current) return;

    const info = gl.info;
    divRef.current.textContent =
      `Calls: ${info.render.calls}  Tris: ${info.render.triangles}  ` +
      `Tex: ${info.memory.textures}  Geo: ${info.memory.geometries}`;
  });

  return null;
}
