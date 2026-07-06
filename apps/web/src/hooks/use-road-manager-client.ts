/**
 * Hook that manages a singleton RoadManagerClient for WASM-based path calculations.
 * Loads OpenDRIVE XML from the editor store and returns a ready-to-use client.
 *
 * Prefers the verbatim .xodr cache while it is valid for the live OpenDRIVE
 * revision (registry mirror); once the model has moved off that revision, falls
 * back to serializing the in-memory document on the fly.
 */

import { useRef, useEffect, useState, useMemo } from 'react';
import { RoadManagerClient } from '../lib/wasm/index.js';
import { useEditorStore } from '../stores/editor-store.js';
import { useDocumentRegistry } from '../stores/document-registry';
import { isRawXmlValid } from '../lib/simulation-xodr';
import { XodrSerializer } from '@osce/opendrive';

export function useRoadManagerClient(): RoadManagerClient | null {
  const cache = useEditorStore((s) => s.roadNetworkRawXml);
  const roadNetwork = useEditorStore((s) => s.roadNetwork);
  // The registry mirrors the live OpenDRIVE revision, so this drives a re-render
  // (and cache re-validation) whenever the model's history position moves.
  const revision = useDocumentRegistry((s) => s.current.roadNetwork);
  const [ready, setReady] = useState(false);
  const clientRef = useRef<RoadManagerClient | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const loadedXmlRef = useRef<string | null>(null);

  // Derive effective XML: verbatim cache while valid for the current revision,
  // otherwise serialize from the parsed document.
  const effectiveXml = useMemo(() => {
    if (isRawXmlValid(cache, revision)) return cache.text;
    if (!roadNetwork) return null;
    const serializer = new XodrSerializer();
    return serializer.serialize(roadNetwork);
  }, [cache, revision, roadNetwork]);

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
