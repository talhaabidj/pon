/**
 * BootScene — Initial loading scene.
 *
 * Finalizes splash boot and transitions into DesktopScene.
 * DesktopScene is lazy-loaded to keep initial JS and LCP light.
 */

import type { Scene } from '../data/types.js';
import type { Game } from '../core/Game.js';
import { configureSceneRouter } from './SceneRouter.js';
import { createDefaultSceneRouter } from './SceneRouterDefaults.js';

export class BootScene implements Scene {
  private game: Game;
  private isReady = false;
  private hasTransitioned = false;

  constructor(game: Game) {
    this.game = game;
  }

  async init() {
    configureSceneRouter(createDefaultSceneRouter());

    const loadingBar = document.querySelector(
      '.loading-bar-fill',
    ) as HTMLElement | null;
    const loadingStatus = document.getElementById('loading-status');

    if (loadingBar) {
      loadingBar.style.animation = 'none';
      loadingBar.style.width = '100%';
    }
    if (loadingStatus) {
      loadingStatus.textContent = 'Launching desktop...';
    }

    // The old fixed delay added >1s to startup and pushed LCP later.
    // Keep only a paint-yield so the splash updates immediately on slow devices.
    await new Promise((resolve) => {
      requestAnimationFrame(() => resolve(undefined));
    });

    // Hide loading screen
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
      setTimeout(() => loadingScreen.remove(), 320);
    }

    // Mark ready — transition happens in update() to avoid re-entrant switchTo
    this.isReady = true;
  }

  update(_dt: number) {
    if (this.isReady && !this.hasTransitioned) {
      this.hasTransitioned = true;
      // Defer import/switch out of update call to keep transition lifecycle stable.
      void this.startDesktop();
    }
  }

  dispose() {
    // Nothing to clean up
  }

  private async startDesktop() {
    const { DesktopScene } = await import('./DesktopScene.js');
    await this.game.sceneManager.switchTo(new DesktopScene(this.game));
  }
}
