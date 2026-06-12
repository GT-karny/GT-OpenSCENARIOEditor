import {
  addToRecentList,
  type RecentFileEntry,
} from './recent-list';

/**
 * IndexedDB persistence for web recent files.
 *
 * The whole recents list is stored as a single record so that ordering and the
 * MAX cap are applied atomically via the pure `addToRecentList` helper.
 * FileSystemFileHandle objects are structured-clonable, so they persist here and
 * can be re-permissioned + reused for re-save on reopen.
 */

const DB_NAME = 'osce-recent-files';
const STORE_NAME = 'recents';
const LIST_KEY = 'list';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
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

async function readList(): Promise<RecentFileEntry[]> {
  const db = await openDb();
  try {
    return await new Promise<RecentFileEntry[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(LIST_KEY);
      req.onsuccess = () => resolve((req.result as RecentFileEntry[] | undefined) ?? []);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

async function writeList(list: RecentFileEntry[]): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(list, LIST_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

/** Return persisted web recent files (most-recent first). Empty on any error. */
export async function getWebRecentFiles(): Promise<RecentFileEntry[]> {
  try {
    return await readList();
  } catch {
    return [];
  }
}

/** Add a web recent-file entry, deduped and capped. Best-effort (silent on error). */
export async function addWebRecentFile(entry: RecentFileEntry): Promise<void> {
  try {
    const list = await readList();
    await writeList(addToRecentList(list, entry));
  } catch {
    // Persistence is best-effort; ignore failures (e.g. private mode).
  }
}

/** Clear all persisted web recent files. */
export async function clearWebRecentFiles(): Promise<void> {
  try {
    await writeList([]);
  } catch {
    // ignore
  }
}
