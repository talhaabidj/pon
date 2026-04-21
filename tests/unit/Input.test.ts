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
  let lockTarget: HTMLCanvasElement;

  function setPointerLockElement(element: Element | null) {
    Object.defineProperty(document, 'pointerLockElement', {
      configurable: true,
      value: element,
    });
  }

  function dispatchMouseMove(movementX: number, movementY: number) {
    const event = new MouseEvent('mousemove');
    Object.defineProperty(event, 'movementX', { value: movementX });
    Object.defineProperty(event, 'movementY', { value: movementY });
    document.dispatchEvent(event);
  }

  beforeEach(() => {
    lockTarget = document.createElement('canvas');
    setPointerLockElement(null);
    input = new Input();
  });

  afterEach(() => {
    input.dispose();
    setPointerLockElement(null);
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

  it('detects service press (KeyR) as just-pressed', () => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'KeyR' }),
    );
    expect(input.isServicePressed()).toBe(true);
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
    setPointerLockElement(lockTarget);
    dispatchMouseMove(9, -3);

    input.endFrame();
    const delta = input.getMouseDelta();
    expect(delta.x).toBe(0);
    expect(delta.y).toBe(0);
  });

  it('ignores mouse delta while pointer is unlocked', () => {
    dispatchMouseMove(14, -6);
    expect(input.getMouseDelta()).toEqual({ x: 0, y: 0 });
  });

  it('tracks mouse delta while pointer is locked', () => {
    setPointerLockElement(lockTarget);
    dispatchMouseMove(14, -6);
    expect(input.getMouseDelta()).toEqual({ x: 14, y: -6 });
  });

  it('clears stale mouse delta when pointer lock state changes', () => {
    setPointerLockElement(lockTarget);
    dispatchMouseMove(14, -6);
    document.dispatchEvent(new Event('pointerlockchange'));

    expect(input.getMouseDelta()).toEqual({ x: 0, y: 0 });
  });
});
