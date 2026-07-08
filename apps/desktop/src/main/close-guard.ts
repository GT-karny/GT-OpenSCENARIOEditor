import { dialog, ipcMain } from 'electron';
import type { BrowserWindow } from 'electron';

/**
 * Unsaved-changes guard for the main window close flow.
 *
 * When the window is asked to close we intercept it, query the renderer for the
 * dirty state, and — if there are unsaved changes — show a native Save / Discard
 * / Cancel dialog. On "Save" we ask the renderer to run its save flow and wait
 * for confirmation before destroying the window.
 *
 * Re-entrancy is guarded by `confirmedClose`: once the user has chosen to close,
 * the subsequent `window.close()` is allowed through without re-prompting.
 */
export function installCloseGuard(window: BrowserWindow): void {
  let confirmedClose = false;
  let prompting = false;

  /**
   * Round-trip helper: send a request to the renderer and resolve with its
   * reply on `replyChannel`, or `fallback` after `timeoutMs`. The reply listener
   * is always cleaned up so stale replies can't leak into a later cycle.
   */
  const request = <T>(
    sendChannel: string,
    replyChannel: string,
    map: (value: unknown) => T,
    fallback: T,
    timeoutMs: number,
  ): Promise<T> =>
    new Promise((resolve) => {
      let settled = false;
      const finish = (value: T) => {
        if (settled) return;
        settled = true;
        ipcMain.removeListener(replyChannel, listener);
        clearTimeout(timer);
        resolve(value);
      };
      const listener = (_event: unknown, value: unknown) => finish(map(value));
      ipcMain.on(replyChannel, listener);
      const timer = setTimeout(() => finish(fallback), timeoutMs);
      window.webContents.send(sendChannel);
    });

  /** Ask the renderer whether the current document has unsaved changes. */
  const queryDirty = (): Promise<boolean> =>
    request('app:close-requested', 'app:close-decision', (v) => Boolean(v), false, 2000);

  /** Ask the renderer to run its save flow; resolves true once it confirms. */
  const runSave = (): Promise<boolean> =>
    request('app:run-save', 'app:save-complete', (v) => Boolean(v), false, 30000);

  window.on('close', (event) => {
    if (confirmedClose) return; // already confirmed — let it close
    if (prompting) {
      // A close was requested while we are mid-prompt; swallow it.
      event.preventDefault();
      return;
    }

    event.preventDefault();
    prompting = true;

    void (async () => {
      try {
        const isDirty = await queryDirty();
        if (!isDirty) {
          confirmedClose = true;
          window.destroy();
          return;
        }

        const { response } = await dialog.showMessageBox(window, {
          type: 'warning',
          buttons: ['Save', "Don't Save", 'Cancel'],
          defaultId: 0,
          cancelId: 2,
          title: 'Unsaved Changes',
          message: 'You have unsaved changes.',
          detail: 'Do you want to save your changes before closing?',
          noLink: true,
        });

        if (response === 2) {
          // Cancel — abort close.
          return;
        }

        if (response === 0) {
          // Save — run the renderer save flow and close on success.
          const saved = await runSave();
          if (!saved) return; // save failed/cancelled — keep window open
        }

        // Save succeeded or "Don't Save" — destroy the window.
        confirmedClose = true;
        window.destroy();
      } finally {
        prompting = false;
      }
    })();
  });
}
