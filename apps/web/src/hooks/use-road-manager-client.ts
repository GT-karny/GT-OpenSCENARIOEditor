/**
 * Hook that manages a singleton RoadManagerClient for WASM-based path calculations.
 * Loads OpenDRIVE XML from the editor store and returns a ready-to-use client.
 *
 * When roadNetworkXml is not available (e.g. after OpenDRIVE editor changes),
 * falls back to serializing the in-memory document on the fly.
 */

import { useRef, useEffect, useState, useMemo } from 'react';
import { RoadManagerClient } from '../lib/wasm/index.js';
import { useEditorStore } from '../stores/editor-store.js';
import { XodrSerializer } from '@osce/opendrive';

export function useRoadManagerClient(): RoadManagerClient | null {
  const roadNetworkXml = useEditorStore((s) => s.roadNetworkXml);
  const roadNetwork = useEditorStore((s) => s.roadNetwork);
  const [ready, setReady] = useState(false);
  const clientRef = useRef<RoadManagerClient | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const loadedXmlRef = useRef<string | null>(null);

  // Derive effective XML: use stored XML if available, otherwise serialize from document
  const effectiveXml = useMemo(() => {
    if (roadNetworkXml) return roadNetworkXml;
    if (!roadNetwork) return null;
    const serializer = new XodrSerializer();
    return serializer.serialize(roadNetwork);
  }, [roadNetworkXml, roadNetwork]);

  useEffect(() => {
    if (!effectiveXml) {
      // No road network — clean up
      clientRef.current?.dispose();
      clientRef.current = null;
      workerRef.current?.terminate();
      workerRef.current = null;
      loadedXmlRef.current = null;
      setReady(false);
      return;
    }

    // Already loaded this XML
    if (loadedXmlRef.current === effectiveXml) return;

    let cancelled = false;

    async function init() {
      // Create worker + client if needed
      if (!workerRef.current) {
        workerRef.current = new Worker(
          new URL('../lib/wasm/esmini-worker.ts', import.meta.url),
        );
      }
      if (!clientRef.current) {
        clientRef.current = new RoadManagerClient(workerRef.current);
      }

      try {
        console.info('[useRoadManagerClient] Loading OpenDRIVE into WASM...');
        await clientRef.current.loadOpenDrive(effectiveXml!);
        if (!cancelled) {
          loadedXmlRef.current = effectiveXml;
          setReady(true);
          console.info('[useRoadManagerClient] OpenDRIVE loaded — ready for path calculations');
        }
      } catch (err) {
        console.warn('[useRoadManagerClient] Failed to load OpenDRIVE:', err);
        if (!cancelled) setReady(false);
      }
    }

    setReady(false);
    init();

    return () => {
      cancelled = true;
    };
  }, [effectiveXml]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clientRef.current?.dispose();
      clientRef.current = null;
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  return ready ? clientRef.current : null;
}
