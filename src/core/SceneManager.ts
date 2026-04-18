/**
 * SceneManager — Manages active scene lifecycle.
 *
 * Holds the current scene implementing the Scene interface,
 * handles transitions (dispose old → init new), and delegates
 * the per-frame update call.
 */

import type { Scene } from '../data/types.js';

export class SceneManager {
  private currentScene: Scene | null = null;
  private isTransitioning = false;

  /** Returns the currently active scene, or null */
  getCurrent(): Scene | null {
    return this.currentScene;
  }

  /** Switch to a new scene: dispose current, then init the new one */
  async switchTo(nextScene: Scene): Promise<void> {
    if (this.isTransitioning) {
      console.warn('SceneManager: transition already in progress, ignoring');
      return;
    }

    this.isTransitioning = true;

    try {
      // Dispose old scene
      if (this.currentScene) {
        this.currentScene.dispose();
      }

      this.currentScene = nextScene;
      await nextScene.init();
    } finally {
      this.isTransitioning = false;
    }
  }

  /** Called every frame by Game.ts with delta time */
  update(dt: number) {
    if (this.currentScene && !this.isTransitioning) {
      this.currentScene.update(dt);
    }
  }

  dispose() {
    if (this.currentScene) {
      this.currentScene.dispose();
      this.currentScene = null;
    }
  }
}
