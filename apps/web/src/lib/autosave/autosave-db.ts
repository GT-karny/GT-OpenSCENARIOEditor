import { migrateSnapshot } from './snapshot-mapping';
import type { AutosaveSnapshot, AutosaveSnapshotV1 } from './types';

/**
 * Minimal promise-based IndexedDB wrapper for the autosave snapshot.
 *
 * The store holds a single rolling record under the key {@link SNAPSHOT_KEY},
 * so writes overwrite the previous snapshot and recovery only ever reads the
 * latest one. Hand-rolled to avoid pulling in an IndexedDB dependency.
 *
 * Every operation resolves rather than rejects on environments without
 * IndexedDB (e.g. SSR, locked-down browsers): get/has return empty, and
 * writes/deletes become no-ops. Genuine request errors still reject so the
 * caller can log them once.
 */

const DB_NAME = 'osce-autosave';
const STORE_NAME = 'snapshots';
const SNAPSHOT_KEY = 'latest';
const DB_VERSION = 1;

function getIndexedDB(): IDBFactory | null {
  if (typeof indexedDB === 'undefined') return null;
  return indexedDB;
}

function openDb(): Promise<IDBDatabase | null> {
  const idb = getIndexedDB();
  if (!idb) return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    const request = idb.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Read the latest snapshot, or null when none exists. */
export async function readSnapshot(): Promise<AutosaveSnapshot | null> {
  const db = await openDb();
  if (!db) return null;

  try {
    return await new Promise<AutosaveSnapshot | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(SNAPSHOT_KEY);
      request.onsuccess = () => {
        // Normalize any legacy (v1) record to the current envelope on the way out.
        const raw = request.result as AutosaveSnapshot | AutosaveSnapshotV1 | undefined;
        resolve(raw ? migrateSnapshot(raw) : null);
      };
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

/** Overwrite the rolling snapshot record. */
export async function writeSnapshot(snapshot: AutosaveSnapshot): Promise<void> {
  const db = await openDb();
  if (!db) return;

  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(snapshot, SNAPSHOT_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

/** Delete the rolling snapshot record. No-op when none exists. */
export async function deleteSnapshot(): Promise<void> {
  const db = await openDb();
  if (!db) return;

  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(SNAPSHOT_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
