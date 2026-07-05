import { describe, it, expect } from 'vitest';
import { CommandHistory } from '@osce/opendrive-engine';
import type { ICommand } from '@osce/shared';

// opendrive-engine re-exports CommandHistory from @osce/scenario-engine. This
// guards that the position-identity revision API (S1-1) is reachable — and
// behaves — through that re-export, so future registry wiring on the road side
// can rely on it without importing scenario-engine directly.
function noopCommand(): ICommand {
  return {
    id: 'noop',
    description: 'noop',
    execute: () => {},
    undo: () => {},
  };
}

describe('CommandHistory revision via @osce/opendrive-engine re-export', () => {
  it('exposes getRevision and derives dirty from history position', () => {
    const history = new CommandHistory();
    const saved = history.getRevision();
    expect(saved).toBe(0);

    history.execute(noopCommand());
    expect(history.getRevision()).not.toBe(saved);

    history.undo();
    expect(history.getRevision()).toBe(saved);
  });
});
