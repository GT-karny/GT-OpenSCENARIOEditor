import { describe, it, expect } from 'vitest';
import type { ICommand } from '@osce/shared';
import { CompoundCommand } from '../commands/compound-command.js';

/** Simple concrete command that records execute/undo calls for testing. */
class TrackingCommand implements ICommand {
  private static counter = 0;

  readonly id = `tracking-${TrackingCommand.counter++}`;
  readonly description: string;
  readonly executeCalls: number[] = [];
  readonly undoCalls: number[] = [];

  constructor(
    description: string,
    private readonly log: string[],
  ) {
    this.description = description;
  }

  execute(): void {
    this.log.push(`execute:${this.id}`);
  }

  undo(): void {
    this.log.push(`undo:${this.id}`);
  }
}

describe('CompoundCommand', () => {
  it('execute runs all sub-commands in order', () => {
    const log: string[] = [];
    const a = new TrackingCommand('A', log);
    const b = new TrackingCommand('B', log);
    const c = new TrackingCommand('C', log);

    const compound = new CompoundCommand('compound-test', [a, b, c]);
    compound.execute();

    expect(log).toEqual([`execute:${a.id}`, `execute:${b.id}`, `execute:${c.id}`]);
  });

  it('undo runs sub-commands in reverse order', () => {
    const log: string[] = [];
    const a = new TrackingCommand('A', log);
    const b = new TrackingCommand('B', log);
    const c = new TrackingCommand('C', log);

    const compound = new CompoundCommand('compound-test', [a, b, c]);
    compound.execute();
    log.length = 0; // clear execute log

    compound.undo();

    expect(log).toEqual([`undo:${c.id}`, `undo:${b.id}`, `undo:${a.id}`]);
  });

  it('description is passed through correctly', () => {
    const compound = new CompoundCommand('Create junction with 3 roads', []);
    expect(compound.description).toBe('Create junction with 3 roads');
  });

  it('getSubCommands returns the sub-commands', () => {
    const log: string[] = [];
    const a = new TrackingCommand('A', log);
    const b = new TrackingCommand('B', log);

    const compound = new CompoundCommand('test', [a, b]);
    const subs = compound.getSubCommands();

    expect(subs).toHaveLength(2);
    expect(subs[0]).toBe(a);
    expect(subs[1]).toBe(b);
  });
});
