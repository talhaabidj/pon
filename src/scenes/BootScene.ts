/**
 * BootScene — Initial loading scene.
 *
 * Shows a minimal loading screen while critical assets are preloaded.
 * Transitions to DesktopScene from update() to avoid re-entrant switchTo.
 */

import type { Scene } from '../data/types.js';
import type { Game } from '../core/Game.js';
import { DesktopScene } from './DesktopScene.js';

export class BootScene implements Scene {
  private game: Game;
  private isReady = false;
  private hasTransitioned = false;

  constructor(game: Game) {
    this.game = game;
  }

  async init() {
    const loadingBar = document.querySelector(
      '.loading-bar-fill',
    ) as HTMLElement | null;

    if (loadingBar) {
      loadingBar.style.animation = 'none';
      loadingBar.style.width = '30%';
    }

    // TODO: Preload critical assets here (models, textures, audio)
    await this.simulateLoading(loadingBar);

    // Hide loading screen
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
      setTimeout(() => loadingScreen.remove(), 500);
    }

    // Mark ready — transition happens in update() to avoid re-entrant switchTo
    this.isReady = true;
  }

  private async simulateLoading(
    bar: HTMLElement | null,
  ): Promise<void> {
    const steps = [40, 60, 80, 100];
    for (const pct of steps) {
      await new Promise((r) => setTimeout(r, 200));
      if (bar) bar.style.width = `${pct}%`;
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  update(_dt: number) {
    if (this.isReady && !this.hasTransitioned) {
      this.hasTransitioned = true;
      // Defer to next microtask so SceneManager.isTransitioning is false
      void this.game.sceneManager.switchTo(new DesktopScene(this.game));
    }
  }

  dispose() {
    // Nothing to clean up
  }
}
