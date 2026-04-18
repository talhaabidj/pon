/**
 * CapsuleSystem unit tests.
 */

import { describe, it, expect } from 'vitest';
import { CapsuleSystem } from '../../src/systems/CapsuleSystem.js';
import type { MachineDefinition, MachineState } from '../../src/data/types.js';

const testMachine: MachineDefinition = {
  id: 'test-machine',
  name: 'Test Machine',
  position: [0, 0, 0],
  rotation: 0,
  itemPoolIds: [
    'neko-macaron',   // common
    'neko-croissant',  // common
    'neko-donut',      // uncommon
    'neko-eclair',     // uncommon
    'neko-cake',       // rare
    'neko-souffle',    // epic
  ],
  rarityWeights: {
    common: 40,
    uncommon: 30,
    rare: 20,
    epic: 9,
    legendary: 1,
  },
  maintenanceDifficulty: 2,
  quirks: ['generous-when-clean'],
};

describe('CapsuleSystem', () => {
  const capsule = new CapsuleSystem();

  it('returns a valid item from the machine pool', () => {
    const result = capsule.pull(testMachine, undefined, undefined, () => 0.5);
    expect(result).not.toBeNull();
    expect(testMachine.itemPoolIds).toContain(result!.item.id);
  });

  it('deterministic RNG produces consistent results', () => {
    let callCount = 0;
    const rng = () => {
      callCount++;
      return 0.1; // Low roll = common rarity
    };

    const result1 = capsule.pull(testMachine, undefined, undefined, rng);
    callCount = 0;
    const result2 = capsule.pull(testMachine, undefined, undefined, () => 0.1);

    // Both should hit common rarity with same RNG
    expect(result1!.item.rarity).toBe(result2!.item.rarity);
  });

  it('dirty machine degrades rarity chances', () => {
    const dirtyState: MachineState = {
      machineId: 'test-machine',
      cleanliness: 'dirty',
      stockLevel: 'ok',
      isJammed: false,
      isPowered: true,
    };

    const result = capsule.pull(testMachine, dirtyState, undefined, () => 0.5);
    expect(result).not.toBeNull();
    expect(result!.wasModified).toBe(true);
  });

  it('clean machine with generous quirk boosts rarity', () => {
    const cleanState: MachineState = {
      machineId: 'test-machine',
      cleanliness: 'clean',
      stockLevel: 'ok',
      isJammed: false,
      isPowered: true,
    };

    const result = capsule.pull(testMachine, cleanState, undefined, () => 0.5);
    expect(result).not.toBeNull();
    expect(result!.wasModified).toBe(true);
  });

  it('3 AM boosts legendary chance', () => {
    const result = capsule.pull(testMachine, undefined, 3, () => 0.5);
    expect(result).not.toBeNull();
    expect(result!.wasModified).toBe(true);
  });

  it('returns null for empty pool machine', () => {
    const emptyMachine: MachineDefinition = {
      ...testMachine,
      id: 'empty',
      itemPoolIds: [],
    };
    const result = capsule.pull(emptyMachine);
    expect(result).toBeNull();
  });

  it('filters time-locked items outside hour 3', () => {
    const timeMachine: MachineDefinition = {
      ...testMachine,
      id: 'time-test',
      itemPoolIds: ['secret-golden-capsule', 'neko-macaron'],
    };

    // Outside 3 AM — should prefer non-time-locked
    const result = capsule.pull(timeMachine, undefined, 22, () => 0.1);
    expect(result).not.toBeNull();
    // With low RNG it should hit common (neko-macaron), not the time-locked one
    expect(result!.item.id).toBe('neko-macaron');
  });
});
