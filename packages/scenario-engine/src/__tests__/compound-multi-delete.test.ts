import { describe, it, expect } from 'vitest';
import { createScenarioStore } from '../store/scenario-store.js';
import { CompoundCommand } from '../commands/compound-command.js';

/**
 * Mirrors the web layer's multi-delete flow: run several individual delete
 * commands, then collapse them into a single CompoundCommand so one undo
 * restores everything.
 */
describe('compound multi-delete', () => {
  it('collapses multiple deletes into one undo entry that restores all', () => {
    const store = createScenarioStore();
    const a = store.getState().addEntity({ name: 'A' });
    const b = store.getState().addEntity({ name: 'B' });
    const c = store.getState().addEntity({ name: 'C' });
    expect(store.getState().getScenario().entities).toHaveLength(3);

    const history = store.getState().getCommandHistory();
    const before = history.getUndoStack().length;

    store.getState().removeEntity(a.id);
    store.getState().removeEntity(b.id);
    store.getState().removeEntity(c.id);
    expect(store.getState().getScenario().entities).toHaveLength(0);

    const added = history.getUndoStack().slice(before);
    expect(added).toHaveLength(3);
    history.collapseUndo(added.length, new CompoundCommand('Delete 3 elements', [...added]));

    // Exactly one entry was added compared to before the deletes.
    expect(history.getUndoStack().length - before).toBe(1);

    // A single undo restores all three entities.
    store.getState().undo();
    expect(store.getState().getScenario().entities).toHaveLength(3);
    const names = store
      .getState()
      .getScenario()
      .entities.map((e) => e.name)
      .sort();
    expect(names).toEqual(['A', 'B', 'C']);

    // Redo re-applies the whole compound.
    store.getState().redo();
    expect(store.getState().getScenario().entities).toHaveLength(0);
  });
});
