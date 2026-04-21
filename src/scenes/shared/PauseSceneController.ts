/**
 * PauseSceneController — shared pause + pointer-lock resume flow for first-person scenes.
 *
 * Flow:
 *   1. ESC pressed → game pauses, cursor unlocks, screen blurs, pause UI shown
 *   2. ESC pressed again → quick resume with free cursor (no blocking overlay)
 *   3. "Resume Game" button → resume and attempt pointer lock immediately
 */

import { FirstPersonController } from '../../core/FirstPersonController.js';
import { requestPointerLockSafely } from '../../core/PointerLock.js';
import {
  hidePauseMenu,
  isPauseMenuVisible,
  setPauseResumeMessage,
  setPauseResumePending,
  showPauseMenu,
} from '../../ui/pauseUI.js';

interface PauseSceneControllerOptions {
  controller: FirstPersonController;
  canvas: HTMLCanvasElement;
  setPaused: (paused: boolean) => void;
}

export class PauseSceneController {
  private readonly controller: FirstPersonController;
  private readonly canvas: HTMLCanvasElement;
  private readonly setPaused: (paused: boolean) => void;

  private pauseOpenedAtMs = 0;
  private static readonly ESC_TOGGLE_DEBOUNCE_MS = 140;

  constructor(options: PauseSceneControllerOptions) {
    this.controller = options.controller;
    this.canvas = options.canvas;
    this.setPaused = options.setPaused;
  }

  openPauseMenu() {
    this.setPaused(true);
    this.pauseOpenedAtMs = performance.now();
    this.controller.setEnabled(false);

    // Exit pointer lock so the user has a free cursor
    if (document.pointerLockElement === this.canvas) {
      document.exitPointerLock();
    }

    showPauseMenu(
      () => {
        void this.resumeFromButton();
      },
    );
  }

  requestResumeFromToggle() {
    if (!isPauseMenuVisible()) return;
    if ((performance.now() - this.pauseOpenedAtMs) < PauseSceneController.ESC_TOGGLE_DEBOUNCE_MS) {
      return;
    }

    this.resumeFromEscape();
  }

  handlePausedFrame() {
    if (this.controller.isEnabled()) {
      this.controller.setEnabled(false);
    }
  }

  /** Kept for scene compatibility; click-to-start overlay flow is no longer used. */
  isClickToStartVisible(): boolean {
    return false;
  }

  dispose() {}

  // ——— Private ———

  private resumeFromEscape() {
    hidePauseMenu();
    this.setPaused(false);
    this.controller.resumeWithFreeCursor();
  }

  private async resumeFromButton() {
    if (!isPauseMenuVisible()) return;

    setPauseResumePending(true);
    setPauseResumeMessage('Resuming...');
    hidePauseMenu();
    this.setPaused(false);

    // Resume immediately and keep fallback usability even if lock fails.
    this.controller.resumeWithFreeCursor();
    const lockResult = await requestPointerLockSafely(this.canvas, { timeoutMs: 1200 });

    if (lockResult === 'locked') {
      setPauseResumeMessage('Resumed. Press ESC to pause.');
    } else {
      setPauseResumeMessage('Resumed with free cursor. Click in the game view to lock cursor.');
    }
    setPauseResumePending(false);
  }
}
