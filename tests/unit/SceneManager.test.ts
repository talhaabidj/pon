/**
 * SceneManager unit tests.
 */

import { describe, it, expect } from 'vitest';
import { SceneManager } from '../../src/core/SceneManager.js';
import type { Scene } from '../../src/data/types.js';

function createMockScene(): Scene & {
  initCalled: boolean;
  updateCalls: number;
  disposeCalled: boolean;
} {
  return {
    initCalled: false,
    updateCalls: 0,
    disposeCalled: false,
    async init() {
      this.initCalled = true;
    },
    update(_dt: number) {
      this.updateCalls++;
    },
    dispose() {
      this.disposeCalled = true;
    },
  };
}

describe('SceneManager', () => {
  it('starts with no current scene', () => {
    const sm = new SceneManager();
    expect(sm.getCurrent()).toBeNull();
  });

  it('switches to a scene and calls init', async () => {
    const sm = new SceneManager();
    const scene = createMockScene();

    await sm.switchTo(scene);

    expect(sm.getCurrent()).toBe(scene);
    expect(scene.initCalled).toBe(true);
  });

  it('disposes the previous scene when switching', async () => {
    const sm = new SceneManager();
    const sceneA = createMockScene();
    const sceneB = createMockScene();

    await sm.switchTo(sceneA);
    await sm.switchTo(sceneB);

    expect(sceneA.disposeCalled).toBe(true);
    expect(sm.getCurrent()).toBe(sceneB);
  });

  it('delegates update to the current scene', async () => {
    const sm = new SceneManager();
    const scene = createMockScene();

    await sm.switchTo(scene);
    sm.update(0.016);
    sm.update(0.016);

    expect(scene.updateCalls).toBe(2);
  });

  it('does not update when no scene is set', () => {
    const sm = new SceneManager();
    // Should not throw
    sm.update(0.016);
  });

  it('dispose cleans up current scene', async () => {
    const sm = new SceneManager();
    const scene = createMockScene();

    await sm.switchTo(scene);
    sm.dispose();

    expect(scene.disposeCalled).toBe(true);
    expect(sm.getCurrent()).toBeNull();
  });
});
