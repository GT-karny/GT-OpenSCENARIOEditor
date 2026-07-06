import { useCallback } from 'react';
import type { ScenarioDocument } from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import { toast } from 'sonner';
import { runValidationOnDocument } from '../use-validation';
import { useEditorStore } from '../../stores/editor-store';
import { addWebRecentFile } from '../../lib/recent-files/recent-files-db';
import type { RecentFileKind } from '../../lib/recent-files/recent-list';
import { runUnsavedGuard as runUnsavedGuardGate } from '../use-discard-guard';

// File picker type definitions for File System Access API
interface FilePickerOptions {
  types?: Array<{
    description: string;
    accept: Record<string, string[]>;
  }>;
  suggestedName?: string;
}

declare global {
  interface Window {
    showOpenFilePicker?: (options?: FilePickerOptions) => Promise<FileSystemFileHandle[]>;
    showSaveFilePicker?: (options?: FilePickerOptions) => Promise<FileSystemFileHandle>;
  }
}

/** Result from reading a file */
export interface ReadResult {
  text: string;
  name: string;
  filePath?: string;
  handle?: FileSystemFileHandle;
}

/**
 * Error thrown when the user cancels a file picker / dialog.
 * Callers treat this as a silent no-op (no toast), matching the native
 * `AbortError` raised by the File System Access API.
 */
export class FilePickerCancelledError extends Error {
  constructor() {
    super('Cancelled');
    this.name = 'AbortError';
  }
}

/** True when an error represents a user-cancelled picker (must stay silent). */
export function isCancelError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}

/** Extract a concise, displayable message from an unknown error. */
export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

/**
 * Register a successfully-opened file into the recents list.
 * Electron tracks absolute paths via IPC; web persists FileSystemFileHandles
 * (when available) in IndexedDB so re-save can reuse the handle.
 */
export function registerRecentFile(
  read: Pick<ReadResult, 'name' | 'filePath' | 'handle'>,
  kind: RecentFileKind,
): void {
  if (window.electronAPI?.isElectron) {
    if (read.filePath) window.electronAPI.addRecentFile(read.filePath);
    return;
  }
  void addWebRecentFile({
    name: read.name,
    kind,
    timestamp: Date.now(),
    handle: read.handle,
  });
}

/** Result from writing a file */
export interface WriteResult {
  handle?: FileSystemFileHandle;
  filePath?: string;
  fileName: string;
}

export async function readFileFromDisk(accept: string, extensions: string[]): Promise<ReadResult> {
  // Electron: use native dialog + Node.js fs
  if (window.electronAPI?.isElectron) {
    const result = await window.electronAPI.showOpenDialog({
      filters: [{ name: `${accept} files`, extensions: extensions.map((e) => e.replace('.', '')) }],
      properties: ['openFile'],
    });
    if (result.canceled || !result.filePaths[0]) throw new FilePickerCancelledError();
    const filePath = result.filePaths[0];
    const text = await window.electronAPI.readFile(filePath);
    const name = filePath.split(/[/\\]/).pop() ?? 'file';
    // Recent-file registration happens centrally after a successful parse
    // (covers menu open, drag-and-drop, and recent reopen uniformly).
    return { text, name, filePath };
  }

  // Try File System Access API first (Chromium)
  if (window.showOpenFilePicker) {
    const [handle] = await window.showOpenFilePicker({
      types: [
        {
          description: `${accept} files`,
          accept: { 'application/xml': extensions },
        },
      ],
    });
    const file = await handle.getFile();
    const text = await file.text();
    return { text, name: file.name, handle };
  }

  // Fallback: hidden file input
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = extensions.join(',');
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new FilePickerCancelledError());
        return;
      }
      const text = await file.text();
      resolve({ text, name: file.name });
    };
    input.oncancel = () => reject(new FilePickerCancelledError());
    input.click();
  });
}

export async function writeFileToDisk(
  content: string,
  extension: string,
  options?: {
    suggestedName?: string | null;
    existingHandle?: FileSystemFileHandle | null;
    existingFilePath?: string | null;
  },
): Promise<WriteResult> {
  const suggestedName = options?.suggestedName;
  const existingHandle = options?.existingHandle;
  const existingFilePath = options?.existingFilePath;
  const defaultName = suggestedName ?? `file${extension}`;

  // Electron: use native dialog + Node.js fs
  if (window.electronAPI?.isElectron) {
    // Overwrite-save: reuse existing file path
    if (existingFilePath) {
      await window.electronAPI.writeFile(existingFilePath, content);
      const fileName = existingFilePath.split(/[/\\]/).pop() ?? defaultName;
      return { filePath: existingFilePath, fileName };
    }
    const result = await window.electronAPI.showSaveDialog({
      defaultPath: defaultName,
      filters: [{ name: `${extension} file`, extensions: [extension.replace('.', '')] }],
    });
    if (result.canceled || !result.filePath) throw new FilePickerCancelledError();
    await window.electronAPI.writeFile(result.filePath, content);
    window.electronAPI.addRecentFile(result.filePath);
    const fileName = result.filePath.split(/[/\\]/).pop() ?? defaultName;
    return { filePath: result.filePath, fileName };
  }

  // File System Access API (Chromium)
  if (window.showSaveFilePicker) {
    // Overwrite-save: reuse existing handle
    if (existingHandle) {
      const writable = await existingHandle.createWritable();
      await writable.write(content);
      await writable.close();
      const file = await existingHandle.getFile();
      return { handle: existingHandle, fileName: file.name };
    }
    const handle = await window.showSaveFilePicker({
      suggestedName: defaultName,
      types: [
        {
          description: `${extension} file`,
          accept: { 'application/xml': [extension] },
        },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
    const file = await handle.getFile();
    return { handle, fileName: file.name };
  }

  // Fallback: download link
  const blob = new Blob([content], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = defaultName;
  a.click();
  URL.revokeObjectURL(url);
  return { fileName: defaultName };
}

/**
 * Auto-validate a scenario before it is serialized/written.
 *
 * When the autoValidate preference is off this is a no-op that always allows
 * the save. Otherwise it validates `doc`, publishes the result so the panel and
 * status bar update, and gates the save:
 * - errors: park a confirmation request in the store and await the user's
 *   choice (Save Anyway / Cancel). Returns the decision.
 * - warnings only: surface a single non-blocking toast and allow the save.
 * - clean: allow silently.
 *
 * Returns `true` when the caller should proceed with the write.
 *
 * Shared plumbing (design doc S6 §D3): consumed today by the xosc side, kept
 * here alongside the other save gates so both sides draw from one place.
 */
export function useGateSaveWithValidation() {
  const setValidationResult = useEditorStore((s) => s.setValidationResult);
  const { t } = useTranslation('common');

  return useCallback(
    (doc: ScenarioDocument): Promise<boolean> => {
      const { preferences } = useEditorStore.getState();
      if (!preferences.autoValidate) return Promise.resolve(true);

      const result = runValidationOnDocument(doc);
      setValidationResult(result);

      if (result.errors.length > 0) {
        return new Promise<boolean>((resolve) => {
          useEditorStore.getState().setValidationConfirm({
            errors: result.errors,
            resolve,
          });
        });
      }

      if (result.warnings.length > 0) {
        toast.warning(t('validationToast.warnings', { count: result.warnings.length }));
      }
      return Promise.resolve(true);
    },
    [setValidationResult, t],
  );
}

/**
 * Save flows the unsaved-changes guard invokes when the user chooses "Save".
 * Held in a ref (see {@link useRunUnsavedGuard}) so the guard can call whichever
 * flows are current without depending on their declaration order.
 */
export interface SaveFns {
  saveXosc: () => Promise<void>;
  saveXodr: () => Promise<void>;
  saveCatalogs: () => Promise<boolean>;
  saveDistribution: () => Promise<boolean>;
}

// Gate a document-replacing action (new / open / drop / reopen) behind the
// shared unsaved-changes guard, saving via the current save flows on "Save".
export function useRunUnsavedGuard(saveFnsRef: { current: SaveFns }) {
  return useCallback(
    () =>
      runUnsavedGuardGate({
        saveXosc: () => saveFnsRef.current.saveXosc(),
        saveXodr: () => saveFnsRef.current.saveXodr(),
        saveCatalogs: () => saveFnsRef.current.saveCatalogs(),
        saveDistribution: () => saveFnsRef.current.saveDistribution(),
      }),
    // The ref has a stable identity; it is listed only because extraction
    // turned it into a parameter the linter cannot verify.
    [saveFnsRef],
  );
}
