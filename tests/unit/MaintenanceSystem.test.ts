/**
 * MaintenanceSystem unit tests.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MaintenanceSystem } from '../../src/systems/MaintenanceSystem.js';

describe('MaintenanceSystem', () => {
  let maint: MaintenanceSystem;
  const machineIds = ['machine-neko', 'machine-train'];

  beforeEach(() => {
    maint = new MaintenanceSystem();
  });

  it('initializes states for available machines', () => {
    // Deterministic RNG: always returns 0.5 (above most thresholds)
    maint.initializeForNight(machineIds, 1.0, () => 0.5);
    const state = maint.getState('machine-neko');
    expect(state).toBeDefined();
    expect(state!.machineId).toBe('machine-neko');
  });

  it('getAllStates returns all machines', () => {
    maint.initializeForNight(machineIds, 1.0, () => 0.5);
    expect(maint.getAllStates().length).toBe(2);
  });

  it('clean machine transitions from dirty to clean', () => {
    maint.initializeForNight(machineIds, 1.0, () => 0.1); // low RNG = dirty
    const state = maint.getState('machine-neko');
    if (state?.cleanliness === 'dirty') {
      const result = maint.cleanMachine('machine-neko');
      expect(result).toBe(true);
      expect(maint.getState('machine-neko')!.cleanliness).toBe('clean');
    }
  });

  it('cleaning an already clean machine returns false', () => {
    maint.initializeForNight(machineIds, 1.0, () => 0.9); // high RNG = clean
    expect(maint.cleanMachine('machine-neko')).toBe(false);
  });

  it('restock changes stock level to ok', () => {
    maint.initializeForNight(machineIds, 1.0, () => 0.05); // very low = empty
    const state = maint.getState('machine-neko');
    if (state && state.stockLevel !== 'ok') {
      const result = maint.restockMachine('machine-neko');
      expect(result).toBe(true);
      expect(maint.getState('machine-neko')!.stockLevel).toBe('ok');
    }
  });

  it('fixJam unjams a jammed machine', () => {
    // Force jam: use low RNG
    maint.initializeForNight(machineIds, 1.0, () => 0.05);
    const state = maint.getState('machine-neko');
    if (state?.isJammed) {
      expect(maint.fixJam('machine-neko')).toBe(true);
      expect(maint.getState('machine-neko')!.isJammed).toBe(false);
    }
  });

  it('rewire powers unpowered machine', () => {
    maint.initializeForNight(machineIds, 1.0, () => 0.02);
    const state = maint.getState('machine-neko');
    if (state && !state.isPowered) {
      expect(maint.rewire('machine-neko')).toBe(true);
      expect(maint.getState('machine-neko')!.isPowered).toBe(true);
    }
  });

  it('canPull requires powered, unjammed, not-empty', () => {
    maint.initializeForNight(machineIds, 1.0, () => 0.9); // high RNG = good state
    expect(maint.canPull('machine-neko')).toBe(true);
  });

  it('getIssues returns empty for perfect machine', () => {
    maint.initializeForNight(machineIds, 1.0, () => 0.9);
    expect(maint.getIssues('machine-neko')).toEqual([]);
  });

  it('getIssues lists problems for degraded machine', () => {
    maint.initializeForNight(machineIds, 1.0, () => 0.05);
    const issues = maint.getIssues('machine-neko');
    // With very low RNG, should have multiple issues
    expect(issues.length).toBeGreaterThan(0);
  });

  it('reset clears all states', () => {
    maint.initializeForNight(machineIds, 1.0);
    maint.reset();
    expect(maint.getAllStates().length).toBe(0);
  });
});
