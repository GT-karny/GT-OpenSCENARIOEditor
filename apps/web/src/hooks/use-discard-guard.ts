import { useDocumentRegistry } from '../stores/document-registry';

/** The user's decision when an in-app open would replace unsaved changes. */
export type DiscardChoice = 'save' | 'discard' | 'cancel';

/**
 * True when any registered document (scenario or road network) has unsaved
 * edits. Read imperatively so the guard adds no re-render subscription.
 */
export function hasUnsavedChanges(): boolean {
  return useDocumentRegistry.getState().anyDirty();
}

// ─── Module-level guard controller ───────────────────────────────────────────
//
// The confirmation dialog is driven imperatively (via a promise) so it can be
// triggered from plain hooks — not just from within a rendered component. A
// tiny external store holds the open state; `DiscardChangesDialog` subscribes
// to it via `useSyncExternalStore`, and the dialog is self-mounted on first use
// so no host component has to place it.

let isOpen = false;
let pendingResolve: ((choice: DiscardChoice) => void) | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const l of listeners) l();
}

/** Subscribe to open-state changes (for `useSyncExternalStore`). */
export function subscribeDiscardGuard(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Current open state (for `useSyncExternalStore`). */
export function getDiscardGuardOpen(): boolean {
  return isOpen;
}

/** Resolve the pending guard with the user's choice and close the dialog. */
export function resolveDiscardGuard(choice: DiscardChoice): void {
  const resolve = pendingResolve;
  pendingResolve = null;
  isOpen = false;
  emit();
  resolve?.(choice);
}

/**
 * Resolve immediately when the document is clean, otherwise open the
 * confirmation dialog and resolve with the user's three-way choice.
 *
 * Callers use the result to gate a document-replacing action:
 * - `'discard'` (also returned when clean): proceed and replace.
 * - `'save'`: run the existing save flow first, then proceed only if it stuck.
 * - `'cancel'`: abort without replacing.
 */
export function confirmDiscardIfDirty(): Promise<DiscardChoice> {
  if (!hasUnsavedChanges()) return Promise.resolve('discard');

  ensureDiscardGuardMounted();

  // If a dialog is somehow already open, cancel the stale one first.
  if (pendingResolve) resolveDiscardGuard('cancel');

  return new Promise<DiscardChoice>((resolve) => {
    pendingResolve = resolve;
    isOpen = true;
    emit();
  });
}

/** Save flows the guard invokes when the user chooses "Save". */
export interface UnsavedGuardSaveFns {
  saveXosc: () => Promise<void> | void;
  saveXodr: () => Promise<void> | void;
  /** Save every dirty catalog; false when one is cancelled/failed. */
  saveCatalogs: () => Promise<boolean>;
  /** Save the distribution side-document; false when cancelled/failed. */
  saveDistribution: () => Promise<boolean>;
}

/**
 * Run the unsaved-changes guard and map the user's three-way choice to a
 * proceed decision for a document-replacing action. Shared by every user-driven
 * open path (menu picker, drag-drop, project file tree) so the semantics stay
 * identical:
 * - clean document or Discard: proceed (return `true`).
 * - Save: run whichever save flow is dirty, then proceed only if the save
 *   actually cleared the dirty state (a cancelled/failed save leaves it dirty).
 * - Cancel: abort (return `false`).
 */
export async function runUnsavedGuard(saveFns: UnsavedGuardSaveFns): Promise<boolean> {
  const choice = await confirmDiscardIfDirty();
  if (choice === 'cancel') return false;
  if (choice === 'discard') return true;

  // choice === 'save': persist whichever document(s) are dirty, in a stable
  // order. Catalog and distribution report their own cancel/failure (a picker
  // abort), so a false return aborts the replace; scenario/road cancellation is
  // detected by the final dirty re-check.
  const registry = useDocumentRegistry.getState();
  if (registry.isDirty('scenario')) await saveFns.saveXosc();
  if (registry.isDirty('roadNetwork')) await saveFns.saveXodr();
  if (registry.isDirty('catalog') && !(await saveFns.saveCatalogs())) return false;
  if (registry.isDirty('distribution') && !(await saveFns.saveDistribution())) return false;

  // Proceed only if the save stuck; a cancelled picker leaves it dirty.
  return !hasUnsavedChanges();
}

// ─── Self-mount ──────────────────────────────────────────────────────────────

let mounted = false;

/**
 * Lazily mount `DiscardChangesDialog` into a dedicated container under
 * `document.body`, wrapped in the app's i18n provider. This runs only in a real
 * browser (skipped under SSR / tests without a DOM), and only once.
 */
function ensureDiscardGuardMounted(): void {
  if (mounted) return;
  if (typeof document === 'undefined') return;
  mounted = true;

  // Dynamic imports keep this browser-only wiring out of the unit-test path,
  // where the guard controller is exercised directly.
  void Promise.all([
    import('react/jsx-runtime'),
    import('react-dom/client'),
    import('@osce/i18n'),
    import('../components/editor/DiscardChangesDialog'),
  ]).then(([{ jsx }, { createRoot }, { I18nextProvider, i18n }, { DiscardChangesDialog }]) => {
    const container = document.createElement('div');
    container.setAttribute('data-discard-guard-root', '');
    document.body.appendChild(container);
    createRoot(container).render(
      jsx(I18nextProvider, { i18n, children: jsx(DiscardChangesDialog, {}) }),
    );
  });
}
