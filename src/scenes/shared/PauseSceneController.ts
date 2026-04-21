/**
 * PauseSceneController — shared pause + pointer-lock resume flow for first-person scenes.
 *
 * Flow:
 *   1. ESC pressed → game pauses, cursor unlocks, screen blurs, pause UI shown
 *   2. ESC pressed again / "Resume Game" → pause UI closes, click-to-resume gate stays
 *   3. User clicks gate → pointer lock requested, gameplay resumes
 */

import { FirstPersonController } from '../../core/FirstPersonController.js';
import { requestPointerLockSafely } from '../../core/PointerLock.js';
import { ClickToStartOverlay } from '../../ui/ClickToStartOverlay.js';
import {
  hidePauseMenu,
  isPauseMenuVisible,
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

  private clickToResumeVisible = false;
  private clickToResumeOverlay: ClickToStartOverlay | null = null;
  private clickToResumePending = false;
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
    this.showClickToResumeOverlay();

    // Exit pointer lock so the user has a free cursor
    if (document.pointerLockElement === this.canvas) {
      document.exitPointerLock();
    }

    showPauseMenu(
      () => {
        this.beginResumeGate();
      },
    );
  }

  requestResumeFromToggle() {
    if (!isPauseMenuVisible()) return;
    if ((performance.now() - this.pauseOpenedAtMs) < PauseSceneController.ESC_TOGGLE_DEBOUNCE_MS) {
      return;
    }

    this.beginResumeGate();
  }

  handlePausedFrame() {
    if (this.controller.isEnabled()) {
      this.controller.setEnabled(false);
    }
  }

  /** Shared scenes use this to freeze gameplay until click-to-resume succeeds. */
  isClickToStartVisible(): boolean {
    return this.clickToResumeVisible;
  }

  dispose() {
    this.clickToResumeOverlay?.dispose();
    this.clickToResumeOverlay = null;
    this.clickToResumeVisible = false;
    this.clickToResumePending = false;
  }

  // ——— Private ———

  private beginResumeGate() {
    if (!isPauseMenuVisible()) return;
    hidePauseMenu();
    this.setPaused(false);
    this.controller.setEnabled(false);
    this.showClickToResumeOverlay();
  }

  private showClickToResumeOverlay() {
    const overlay = this.ensureClickToResumeOverlay();
    this.clickToResumeVisible = true;
    this.clickToResumePending = false;
    overlay.show();
  }

  private hideClickToResumeOverlay() {
    if (!this.clickToResumeOverlay) return;
    this.clickToResumeVisible = false;
    this.clickToResumePending = false;
    this.clickToResumeOverlay.hide();
  }

  private ensureClickToResumeOverlay(): ClickToStartOverlay {
    if (this.clickToResumeOverlay) return this.clickToResumeOverlay;

    this.clickToResumeOverlay = new ClickToStartOverlay({
      id: 'pause-click-resume-overlay',
      zIndex: 980,
      onActivate: () => {
        void this.resumeFromClick();
      },
    });
    return this.clickToResumeOverlay;
  }

  private async resumeFromClick() {
    if (!this.clickToResumeVisible || this.clickToResumePending) return;
    this.clickToResumePending = true;

    const lockResult = await requestPointerLockSafely(this.canvas, { timeoutMs: 1200 });
    if (lockResult === 'locked') {
      this.controller.setEnabled(true);
      this.hideClickToResumeOverlay();
      return;
    }

    this.clickToResumePending = false;
  }
}
