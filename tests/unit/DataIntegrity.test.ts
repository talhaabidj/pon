/**
 * Data layer unit tests — validates items, sets, machines, tasks, progression.
 */

import { describe, it, expect } from 'vitest';
import { ITEMS, getItemById, getItemsBySet } from '../../src/data/items.js';
import { SETS, getSetById } from '../../src/data/sets.js';
import { MACHINES, getAvailableMachines } from '../../src/data/machines.js';
import { TASK_TEMPLATES } from '../../src/data/tasks.js';
import { PROGRESSION, getProgressionForNight } from '../../src/data/progression.js';

describe('Data: Items', () => {
  it('has at least 24 items', () => {
    expect(ITEMS.length).toBeGreaterThanOrEqual(24);
  });

  it('all items have unique IDs', () => {
    const ids = ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all items reference a valid set', () => {
    for (const item of ITEMS) {
      const set = getSetById(item.setId);
      expect(set).toBeDefined();
    }
  });

  it('getItemById works', () => {
    const item = getItemById('neko-macaron');
    expect(item).toBeDefined();
    expect(item!.name).toBe('Macaron Mew');
  });

  it('getItemsBySet returns correct count for neko-patisserie', () => {
    const items = getItemsBySet('neko-patisserie');
    expect(items.length).toBe(6);
  });
});

describe('Data: Sets', () => {
  it('has exactly 4 sets', () => {
    expect(SETS.length).toBe(4);
  });

  it('each set references existing items', () => {
    for (const set of SETS) {
      for (const itemId of set.itemIds) {
        expect(getItemById(itemId)).toBeDefined();
      }
    }
  });

  it('each set has a completion reward', () => {
    for (const set of SETS) {
      expect(set.completionReward.length).toBeGreaterThan(0);
    }
  });
});

describe('Data: Machines', () => {
  it('has 8 machines', () => {
    expect(MACHINES.length).toBe(8);
  });

  it('all machine IDs are unique', () => {
    const ids = MACHINES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('machine item pools reference existing items', () => {
    for (const machine of MACHINES) {
      for (const itemId of machine.itemPoolIds) {
        expect(getItemById(itemId)).toBeDefined();
      }
    }
  });

  it('rarity weights sum to > 0 for non-wondertrade machines', () => {
    for (const machine of MACHINES) {
      if (machine.id === 'machine-wondertrade') continue;
      const total = Object.values(machine.rarityWeights).reduce((a, b) => a + b, 0);
      expect(total).toBeGreaterThan(0);
    }
  });

  it('getAvailableMachines filters by nights worked', () => {
    const night1 = getAvailableMachines(0);
    const night5 = getAvailableMachines(5);
    expect(night5.length).toBeGreaterThan(night1.length);
  });
});

describe('Data: Tasks', () => {
  it('has 5 task templates', () => {
    expect(TASK_TEMPLATES.length).toBe(5);
  });

  it('all tasks have positive rewards', () => {
    for (const t of TASK_TEMPLATES) {
      expect(t.baseReward).toBeGreaterThan(0);
    }
  });

  it('all tasks have positive time costs', () => {
    for (const t of TASK_TEMPLATES) {
      expect(t.timeCost).toBeGreaterThan(0);
    }
  });
});

describe('Data: Progression', () => {
  it('has at least 6 steps', () => {
    expect(PROGRESSION.length).toBeGreaterThanOrEqual(6);
  });

  it('nights are sequential starting from 1', () => {
    PROGRESSION.forEach((step, i) => {
      expect(step.night).toBe(i + 1);
    });
  });

  it('difficulty increases over time', () => {
    for (let i = 1; i < PROGRESSION.length; i++) {
      expect(PROGRESSION[i]!.difficultyModifier).toBeGreaterThanOrEqual(
        PROGRESSION[i - 1]!.difficultyModifier,
      );
    }
  });

  it('getProgressionForNight handles out-of-range nights', () => {
    const step = getProgressionForNight(99);
    // Should return valid progression with scaled difficulty
    expect(step.difficultyModifier).toBeGreaterThan(1.5);
    expect(step.availableMachineIds.length).toBeGreaterThan(0);
  });
});
