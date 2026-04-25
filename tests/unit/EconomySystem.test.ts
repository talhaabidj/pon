/**
 * EconomySystem unit tests.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EconomySystem } from '../../src/systems/EconomySystem.js';
import { TOKEN_PRICE, PULL_COST } from '../../src/core/Config.js';

describe('EconomySystem', () => {
  let economy: EconomySystem;

  beforeEach(() => {
    economy = new EconomySystem(500, 3);
  });

  it('initializes with given money and tokens', () => {
    expect(economy.getMoney()).toBe(500);
    expect(economy.getTokens()).toBe(3);
  });

  it('earns money', () => {
    economy.earnMoney(100);
    expect(economy.getMoney()).toBe(600);
  });

  it('ignores negative or zero earnings', () => {
    economy.earnMoney(0);
    economy.earnMoney(-50);
    expect(economy.getMoney()).toBe(500);
  });

  it('adds bonus tokens without changing money', () => {
    economy.addTokens(2);
    expect(economy.getTokens()).toBe(5);
    expect(economy.getMoney()).toBe(500);
  });

  it('ignores non-positive token grants', () => {
    economy.addTokens(0);
    economy.addTokens(-3);
    expect(economy.getTokens()).toBe(3);
  });

  it('buys tokens with money', () => {
    const bought = economy.buyTokens(2);
    expect(bought).toBe(2);
    expect(economy.getTokens()).toBe(5);
    expect(economy.getMoney()).toBe(500 - 2 * TOKEN_PRICE);
  });

  it('buys only affordable tokens when underfunded', () => {
    const poor = new EconomySystem(TOKEN_PRICE * 2 + 5, 0);
    const bought = poor.buyTokens(5);
    expect(bought).toBe(2);
    expect(poor.getTokens()).toBe(2);
  });

  it('spends tokens for a pull', () => {
    const result = economy.spendPull();
    expect(result).toBe(true);
    expect(economy.getTokens()).toBe(3 - PULL_COST);
  });

  it('fails to pull with insufficient tokens', () => {
    const broke = new EconomySystem(0, 0);
    expect(broke.spendPull()).toBe(false);
    expect(broke.getTokens()).toBe(0);
  });

  it('canPull checks correctly', () => {
    expect(economy.canPull()).toBe(true);
    const broke = new EconomySystem(0, 0);
    expect(broke.canPull()).toBe(false);
  });

  it('loads state', () => {
    economy.loadState(1000, 10);
    expect(economy.getMoney()).toBe(1000);
    expect(economy.getTokens()).toBe(10);
  });
});
