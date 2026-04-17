import { describe, expect, it } from 'vitest';
import { CapsuleSystem } from '../../src/systems/CapsuleSystem';
import { CollectionSystem } from '../../src/systems/CollectionSystem';
import { EconomySystem } from '../../src/systems/EconomySystem';
import { ProgressionSystem } from '../../src/systems/ProgressionSystem';
import { TaskSystem } from '../../src/systems/TaskSystem';
import { TimeSystem } from '../../src/systems/TimeSystem';
import { DEFAULT_SAVE_DATA } from '../../src/core/Save';

describe('CapsuleSystem', () => {
  it('returns deterministic pulls for the same machine and seed', () => {
    const system = new CapsuleSystem();
    const firstPull = system.pull('machine-neon-cats', 'fixed-seed');
    const secondPull = system.pull('machine-neon-cats', 'fixed-seed');

    expect(secondPull.itemId).toBe(firstPull.itemId);
    expect(secondPull.machineId).toBe('machine-neon-cats');
  });

  it('marks duplicate pulls as not new when already owned', () => {
    const system = new CapsuleSystem();
    const firstPull = system.pull('machine-retro-robots', 'duplicate-seed');
    const duplicatePull = system.pull('machine-retro-robots', 'duplicate-seed', [firstPull.itemId]);

    expect(duplicatePull.isNew).toBe(false);
  });
});

describe('CollectionSystem', () => {
  it('tracks duplicates and set completion', () => {
    const system = new CollectionSystem();

    expect(system.addItem('neon-cat-nap')).toBe(true);
    expect(system.addItem('neon-cat-nap')).toBe(false);
    system.addItem('neon-cat-vending');
    system.addItem('neon-cat-ticket');
    system.addItem('neon-cat-static');

    expect(system.getSetProgress('neon-cats').complete).toBe(true);
    expect(system.getCompletedSets().map((set) => set.id)).toContain('neon-cats');
  });
});

describe('EconomySystem', () => {
  it('converts wages to tokens and blocks overspending', () => {
    const system = new EconomySystem();
    system.addWages(250);

    const conversion = system.convertMoneyToTokens();

    expect(conversion.moneySpent).toBe(200);
    expect(conversion.tokensGained).toBe(2);
    expect(system.spendTokens(1)).toBe(true);
    expect(system.spendTokens(2)).toBe(false);
    expect(system.getBalances()).toMatchObject({ money: 50, tokens: 1 });
  });
});

describe('TaskSystem', () => {
  it('generates deterministic tasks for a night and seed', () => {
    const first = new TaskSystem().generateNightTasks(
      1,
      ['machine-neon-cats', 'machine-retro-robots'],
      3,
      'tasks',
    );
    const second = new TaskSystem().generateNightTasks(
      1,
      ['machine-neon-cats', 'machine-retro-robots'],
      3,
      'tasks',
    );

    expect(second).toEqual(first);
    expect(first).toHaveLength(3);
    expect(first.every((task) => task.completed === false)).toBe(true);
  });
});

describe('TimeSystem and ProgressionSystem', () => {
  it('formats the overnight clock and checks rare windows', () => {
    const time = new TimeSystem();

    time.advanceMinutes(5 * 60 + 7);

    expect(time.getClock()).toBe('03:07');
    expect(time.isWithinWindow('02:45', '03:20')).toBe(true);
  });

  it('unlocks machines based on the saved night', () => {
    const progression = new ProgressionSystem();

    expect(progression.getUnlockedMachines(DEFAULT_SAVE_DATA)).toContain('machine-neon-cats');
    expect(
      progression.getUnlockedMachines({
        ...DEFAULT_SAVE_DATA,
        night: 3,
      }),
    ).toContain('machine-wondertrade');
  });
});
