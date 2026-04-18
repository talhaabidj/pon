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
  private transitionOverlay: HTMLDivElement | null = null;

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
      // Fade to black
      await this.fadeIn();

      // Dispose old scene
      if (this.currentScene) {
        this.currentScene.dispose();
      }

      this.currentScene = nextScene;
      await nextScene.init();

      // Fade from black
      await this.fadeOut();
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
    this.transitionOverlay?.remove();
    this.transitionOverlay = null;
  }

  /** Ensure transition overlay exists */
  private getOverlay(): HTMLDivElement | null {
    if (typeof document === 'undefined') return null;
    if (!this.transitionOverlay) {
      const el = document.createElement('div');
      el.className = 'scene-transition-overlay';
      el.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: #000; z-index: 90; pointer-events: none;
        opacity: 0; transition: opacity 0.35s ease-in-out;
      `;
      document.body.appendChild(el);
      this.transitionOverlay = el;
    }
    return this.transitionOverlay;
  }

  /** Fade to black */
  private fadeIn(): Promise<void> {
    return new Promise((resolve) => {
      const overlay = this.getOverlay();
      if (!overlay) { resolve(); return; }
      overlay.style.opacity = '0';
      // Force reflow
      void overlay.offsetWidth;
      overlay.style.opacity = '1';
      setTimeout(resolve, 350);
    });
  }

  /** Fade from black */
  private fadeOut(): Promise<void> {
    return new Promise((resolve) => {
      const overlay = this.getOverlay();
      if (!overlay) { resolve(); return; }
      overlay.style.opacity = '0';
      setTimeout(resolve, 350);
    });
  }
}
