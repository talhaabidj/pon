/**
 * Config module unit tests.
 *
 * Validates that configuration constants are sensible values.
 */

import { describe, it, expect } from 'vitest';
import {
  WALK_SPEED,
  RUN_SPEED,
  MOUSE_SENSITIVITY,
  PLAYER_HEIGHT,
  TOKEN_PRICE,
  NIGHT_START_MINUTES,
  NIGHT_END_MINUTES,
  SAVE_KEY,
  DEFAULT_SETTINGS,
} from '../../src/core/Config.js';

describe('Config', () => {
  it('walk speed is less than run speed', () => {
    expect(WALK_SPEED).toBeLessThan(RUN_SPEED);
  });

  it('mouse sensitivity is a small positive number', () => {
    expect(MOUSE_SENSITIVITY).toBeGreaterThan(0);
    expect(MOUSE_SENSITIVITY).toBeLessThan(0.1);
  });

  it('player height is in a reasonable range', () => {
    expect(PLAYER_HEIGHT).toBeGreaterThan(1.0);
    expect(PLAYER_HEIGHT).toBeLessThan(2.5);
  });

  it('night starts before it ends', () => {
    expect(NIGHT_START_MINUTES).toBeLessThan(NIGHT_END_MINUTES);
  });

  it('token price is positive', () => {
    expect(TOKEN_PRICE).toBeGreaterThan(0);
  });

  it('save key is a non-empty string', () => {
    expect(SAVE_KEY).toBeTruthy();
    expect(typeof SAVE_KEY).toBe('string');
  });

  it('default settings have valid volume ranges', () => {
    expect(DEFAULT_SETTINGS.masterVolume).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_SETTINGS.masterVolume).toBeLessThanOrEqual(1);
    expect(DEFAULT_SETTINGS.sfxVolume).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_SETTINGS.sfxVolume).toBeLessThanOrEqual(1);
    expect(DEFAULT_SETTINGS.dynamicResolution).toBe(true);
    expect(DEFAULT_SETTINGS.maxRenderScale).toBe(0.9);
    expect(DEFAULT_SETTINGS.minRenderScale).toBeGreaterThan(0);
    expect(DEFAULT_SETTINGS.maxRenderScale).toBeLessThanOrEqual(1);
  });
});
