/**
 * Hook that manages a singleton RoadManagerClient for WASM-based path calculations.
 * Loads OpenDRIVE XML from the editor store and returns a ready-to-use client.
 */

import { useRef, useEffect, useState } from 'react';
import { RoadManagerClient } from '../lib/wasm/index.js';
import { useEditorStore } from '../stores/editor-store.js';

export function useRoadManagerClient(): RoadManagerClient | null {
  const roadNetworkXml = useEditorStore((s) => s.roadNetworkXml);
  const [ready, setReady] = useState(false);
  const clientRef = useRef<RoadManagerClient | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const loadedXmlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!roadNetworkXml) {
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
    if (loadedXmlRef.current === roadNetworkXml) return;

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
        await clientRef.current.loadOpenDrive(roadNetworkXml!);
        if (!cancelled) {
          loadedXmlRef.current = roadNetworkXml;
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
  }, [roadNetworkXml]);

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
