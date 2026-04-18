/**
 * ProgressionSystem unit tests.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ProgressionSystem } from '../../src/systems/ProgressionSystem.js';

describe('ProgressionSystem', () => {
  let prog: ProgressionSystem;

  beforeEach(() => {
    prog = new ProgressionSystem();
  });

  it('starts at night 1', () => {
    expect(prog.getCurrentNight()).toBe(1);
    expect(prog.getNightsWorked()).toBe(0);
  });

  it('increments night on completion', () => {
    prog.completeNight({
      night: 1,
      tasksCompleted: 3,
      tasksTotal: 4,
      moneyEarned: 200,
      tokensSpent: 0,
      itemsObtained: [],
      secretsTriggered: [],
    });
    expect(prog.getNightsWorked()).toBe(1);
    expect(prog.getCurrentNight()).toBe(2);
  });

  it('gets correct progression for each night', () => {
    const step = prog.getCurrentProgression();
    expect(step.night).toBe(1);
    expect(step.taskCount[0]).toBeGreaterThan(0);
  });

  it('unlocks wondertrade after night 3', () => {
    for (let i = 0; i < 3; i++) {
      prog.completeNight({
        night: i + 1,
        tasksCompleted: 3,
        tasksTotal: 4,
        moneyEarned: 200,
        tokensSpent: 0,
        itemsObtained: [],
        secretsTriggered: [],
      });
    }
    expect(prog.isUnlocked('wondertrade')).toBe(true);
  });

  it('wondertrade is NOT unlocked before night 3', () => {
    expect(prog.isUnlocked('wondertrade')).toBe(false);
  });

  it('hidden machine unlocks after night 5', () => {
    for (let i = 0; i < 5; i++) {
      prog.completeNight({
        night: i + 1,
        tasksCompleted: 3,
        tasksTotal: 4,
        moneyEarned: 200,
        tokensSpent: 0,
        itemsObtained: [],
        secretsTriggered: [],
      });
    }
    expect(prog.isUnlocked('hidden_machine')).toBe(true);
  });

  it('tracks secrets triggered', () => {
    prog.completeNight({
      night: 1,
      tasksCompleted: 3,
      tasksTotal: 4,
      moneyEarned: 200,
      tokensSpent: 0,
      itemsObtained: [],
      secretsTriggered: ['secret-01'],
    });
    expect(prog.getSecretsTriggered()).toContain('secret-01');
  });

  it('triggerSecret returns false for already-triggered', () => {
    prog.triggerSecret('test');
    expect(prog.triggerSecret('test')).toBe(false);
  });

  it('loads state', () => {
    prog.loadState({
      nightsWorked: 4,
      secretsTriggered: ['secret-a'],
    });
    expect(prog.getNightsWorked()).toBe(4);
    expect(prog.getCurrentNight()).toBe(5);
    expect(prog.getSecretsTriggered()).toContain('secret-a');
  });
});
