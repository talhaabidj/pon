/**
 * TimeSystem unit tests.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TimeSystem } from '../../src/systems/TimeSystem.js';
import {
  NIGHT_START_MINUTES,
  NIGHT_END_MINUTES,
} from '../../src/core/Config.js';

describe('TimeSystem', () => {
  let time: TimeSystem;

  beforeEach(() => {
    time = new TimeSystem();
  });

  it('starts at night start time', () => {
    expect(time.getCurrentMinutes()).toBe(NIGHT_START_MINUTES);
  });

  it('starts at hour 22', () => {
    expect(time.getCurrentHour()).toBe(22);
  });

  it('advances time', () => {
    time.advance(30);
    expect(time.getCurrentMinutes()).toBe(NIGHT_START_MINUTES + 30);
  });

  it('wraps past midnight correctly', () => {
    // Advance to 00:30 (1350 - 1320 = 30 minutes past start, then + 90 more)
    time.advance(120); // 22:00 + 120 min = 00:00
    expect(time.getCurrentHour()).toBe(0);
  });

  it('formats time correctly', () => {
    // At start (22:00)
    const formatted = time.getFormattedTime();
    expect(formatted).toBe('10:00 PM');
  });

  it('formats AM time correctly', () => {
    time.advance(180); // 22:00 + 180 = 01:00
    expect(time.getFormattedTime()).toBe('01:00 AM');
  });

  it('detects night end', () => {
    expect(time.isOver()).toBe(false);
    const remaining = time.getRemainingMinutes();
    time.advance(remaining + 1);
    expect(time.isOver()).toBe(true);
  });

  it('stops advancing after night ends', () => {
    const total = NIGHT_END_MINUTES - NIGHT_START_MINUTES;
    time.advance(total + 100);
    const mins = time.getCurrentMinutes();
    time.advance(50); // Should do nothing
    expect(time.getCurrentMinutes()).toBe(mins);
  });

  it('calculates night progress', () => {
    expect(time.getNightProgress()).toBeCloseTo(0, 1);
    const total = NIGHT_END_MINUTES - NIGHT_START_MINUTES;
    time.advance(total / 2);
    expect(time.getNightProgress()).toBeCloseTo(0.5, 1);
  });

  it('detects ending soon', () => {
    expect(time.isEndingSoon()).toBe(false);
    const remaining = time.getRemainingMinutes();
    time.advance(remaining - 10);
    expect(time.isEndingSoon()).toBe(true);
  });

  it('resets correctly', () => {
    time.advance(200);
    time.reset();
    expect(time.getCurrentMinutes()).toBe(NIGHT_START_MINUTES);
    expect(time.isOver()).toBe(false);
  });
});
