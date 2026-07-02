/**
 * Patch-based command base.
 *
 * Replaces the former per-command `structuredClone` + hand-restore undo pattern
 * with immer's `produceWithPatches` / `applyPatches`. Subclasses express a
 * mutation as a recipe (a function that mutates an immer draft); the base
 * records the forward and inverse patches on the first `execute()` and reuses
 * them for undo/redo.
 *
 * ## Redo strategy: stored-patch replay (not recipe re-run)
 *
 * `CommandHistory.redo()` calls `execute()` again. This base replays the stored
 * forward patches on redo rather than re-running the recipe. Replay is:
 *   - faster (no draft/diff work), and
 *   - byte-identical to the original forward transition.
 *
 * Replay is only correct when the recipe is deterministic w.r.t. the state it
 * runs against, so that the state present at redo time equals the state present
 * at first-execute time. Every opendrive-engine command satisfies this: all
 * non-deterministic inputs (generated ids via `nextNumericId`, freshly built
 * entities) are computed in the command *constructor* and captured as instance
 * fields, so the recipe itself is a pure function of the current document plus
 * those captured constants. Undo restores the exact pre-execute state via the
 * inverse patches, so redo sees the same base state the recipe first ran on.
 * Recipe re-run would therefore produce the same patches — replay just skips
 * recomputing them.
 *
 * A command that guards with an early `return` (e.g. "road not found") produces
 * an empty patch set; replaying or inverting an empty patch set is a no-op,
 * preserving the old behaviour where such commands changed nothing.
 */

import { produceWithPatches, applyPatches, type Patch, type Objectish } from 'immer';
import { BaseCommand } from '@osce/scenario-engine';
import './immer-setup.js';

/** A recipe mutates an immer draft of a state root in place. */
export type PatchRecipe<S> = (draft: S) => void;

/**
 * One state root touched by a command: how to read it, how to write it back,
 * and the patches captured for that root on first execute.
 */
interface PatchEntry<S extends Objectish> {
  readonly get: () => S;
  readonly set: (next: S) => void;
  patches: Patch[];
  inversePatches: Patch[];
}

export abstract class PatchCommand extends BaseCommand {
  /**
   * Recorded per-root patch entries, in the order the recipes ran. Redo replays
   * them front-to-back; undo inverts them back-to-front.
   */
  private readonly entries: PatchEntry<Objectish>[] = [];

  /** True once the first `execute()` has captured patches. */
  private captured = false;

  /** Cursor into {@link entries} used while replaying on redo. */
  private replayIndex = 0;

  constructor(description: string) {
    super(description);
  }

  /**
   * Perform the command's mutations by calling {@link mutate} once per state
   * root. Runs the recipes and captures patches on the first invocation; on
   * later invocations (redo) it replays the captured forward patches.
   */
  abstract apply(): void;

  /**
   * Side effects (e.g. dirty-flag marking) that run after a forward
   * execute/redo, independent of the document mutation. Default: no-op.
   */
  protected markSideEffects(): void {}

  /**
   * Side effects that run after an undo. Defaults to the same set as the
   * forward direction; override when undo must touch a different set of ids
   * (e.g. a road that only exists again after the undo re-inserts it).
   */
  protected markUndoSideEffects(): void {
    this.markSideEffects();
  }

  /**
   * Run a recipe against a state root. On first execution the recipe is
   * evaluated via `produceWithPatches` and its patches recorded; on redo the
   * recorded forward patches are replayed instead.
   */
  protected mutate<S extends Objectish>(
    get: () => S,
    set: (next: S) => void,
    recipe: PatchRecipe<S>,
  ): void {
    if (this.captured) {
      // Redo path: replay the already-captured forward patches for this root.
      // Entries were recorded in call order, so consume them in the same order,
      // using the accessors captured with the entry (no narrowing needed).
      const entry = this.entries[this.replayIndex];
      this.replayIndex += 1;
      if (entry) {
        entry.set(applyPatches(entry.get(), entry.patches));
      }
      return;
    }

    const [next, patches, inversePatches] = produceWithPatches(get(), (draft) => {
      recipe(draft as S);
    });
    this.entries.push({
      get: get as () => Objectish,
      set: set as (next: Objectish) => void,
      patches,
      inversePatches,
    });
    set(next as S);
  }

  execute(): void {
    this.replayIndex = 0;
    this.apply();
    this.captured = true;
    this.markSideEffects();
  }

  undo(): void {
    // Invert in reverse order so multi-root commands unwind consistently.
    for (let i = this.entries.length - 1; i >= 0; i--) {
      const entry = this.entries[i];
      entry.set(applyPatches(entry.get(), entry.inversePatches));
    }
    this.markUndoSideEffects();
  }
}
