/**
 * Input system unit tests.
 *
 * Since Input relies on DOM events, we mock them via dispatching
 * synthetic events on the window/document.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Input } from '../../src/core/Input.js';

describe('Input', () => {
  let input: Input;

  beforeEach(() => {
    input = new Input();
  });

  afterEach(() => {
    input.dispose();
  });

  it('returns zero movement vector with no keys pressed', () => {
    const vec = input.getMovementVector();
    expect(vec.x).toBe(0);
    expect(vec.z).toBe(0);
  });

  it('detects key down via keydown event', () => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'KeyW' }),
    );
    expect(input.isKeyDown('KeyW')).toBe(true);
  });

  it('detects key up via keyup event', () => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'KeyW' }),
    );
    window.dispatchEvent(
      new KeyboardEvent('keyup', { code: 'KeyW' }),
    );
    expect(input.isKeyDown('KeyW')).toBe(false);
  });

  it('reports forward movement when W is pressed', () => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'KeyW' }),
    );
    const vec = input.getMovementVector();
    expect(vec.z).toBeLessThan(0); // forward is -z
    expect(vec.x).toBe(0);
  });

  it('normalizes diagonal movement', () => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'KeyW' }),
    );
    window.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'KeyD' }),
    );
    const vec = input.getMovementVector();
    const len = Math.sqrt(vec.x * vec.x + vec.z * vec.z);
    expect(len).toBeCloseTo(1, 5);
  });

  it('detects interact press (KeyE) as just-pressed', () => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'KeyE' }),
    );
    expect(input.isInteractPressed()).toBe(true);
  });

  it('clears just-pressed state after endFrame', () => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'KeyE' }),
    );
    input.endFrame();
    expect(input.isInteractPressed()).toBe(false);
  });

  it('detects running (Shift key)', () => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'ShiftLeft' }),
    );
    expect(input.isRunning()).toBe(true);
  });

  it('resets mouse delta after endFrame', () => {
    // Mouse delta is accumulated from mousemove events
    // After endFrame, it should reset
    input.endFrame();
    const delta = input.getMouseDelta();
    expect(delta.x).toBe(0);
    expect(delta.y).toBe(0);
  });
});
