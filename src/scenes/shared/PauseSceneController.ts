/**
 * PauseSceneController — shared pause + pointer-lock resume flow for first-person scenes.
 *
 * Flow:
 *   1. ESC pressed → game pauses, cursor unlocks, screen blurs, pause UI shown
 *   2. "Resume Game" clicked OR ESC pressed again → pause UI hides,
 *      but a "CLICK TO START" blurred overlay remains
 *   3. User clicks the overlay → cursor locks, game resumes
 */

import { FirstPersonController } from '../../core/FirstPersonController.js';
import { requestPointerLockSafely } from '../../core/PointerLock.js';
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

  private pauseOpenedAtMs = 0;
  private clickToStartEl: HTMLDivElement | null = null;
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
        // "Resume Game" button clicked
        this.transitionToClickToStart();
      },
    );
  }

  requestResumeFromToggle() {
    if (!isPauseMenuVisible()) return;
    if ((performance.now() - this.pauseOpenedAtMs) < PauseSceneController.ESC_TOGGLE_DEBOUNCE_MS) {
      return;
    }

    this.transitionToClickToStart();
  }

  handlePausedFrame() {
    if (this.controller.isEnabled()) {
      this.controller.setEnabled(false);
    }
  }

  /** True when the blurred "CLICK TO START" overlay is showing after resume. */
  isClickToStartVisible(): boolean {
    return this.clickToStartEl !== null;
  }

  dispose() {
    this.removeClickToStart();
  }

  // ——— Private ———

  /**
   * Hide the pause panel but show a blurred "CLICK TO START" overlay.
   * The game stays paused until the user clicks.
   */
  private transitionToClickToStart() {
    hidePauseMenu();

    // If already showing, don't duplicate
    if (this.clickToStartEl) return;

    const overlay = document.createElement('div');
    overlay.id = 'pause-click-to-start';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 1300;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(10, 12, 18, 0.52);
      backdrop-filter: blur(6px) saturate(0.72);
      cursor: pointer;
      user-select: none;
      opacity: 0;
      transition: opacity 0.18s ease;
    `;

    const title = document.createElement('div');
    title.innerText = 'CLICK TO START';
    title.style.cssText = `
      color: #ffffff;
      font-family: 'Segoe UI', sans-serif;
      font-size: clamp(1.8rem, 4vw, 2.4rem);
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      text-shadow: 0 0 26px rgba(255, 255, 255, 0.22);
      animation: pulse-text 2s ease-in-out infinite;
    `;

    // Add the pulse animation if not already present
    if (!document.getElementById('pause-cts-style')) {
      const style = document.createElement('style');
      style.id = 'pause-cts-style';
      style.textContent = `
        @keyframes pulse-text {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `;
      document.head.appendChild(style);
    }

    overlay.appendChild(title);

    const resumeFromClick = () => {
      overlay.style.opacity = '0';
      window.setTimeout(() => {
        this.removeClickToStart();
      }, 180);

      this.setPaused(false);
      this.controller.setEnabled(true);
      requestPointerLockSafely(this.canvas);
    };

    overlay.addEventListener('pointerdown', resumeFromClick);
    overlay.addEventListener('click', resumeFromClick);

    this.clickToStartEl = overlay;
    document.body.appendChild(overlay);

    // Fade in after a frame
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
    });
  }

  private removeClickToStart() {
    if (this.clickToStartEl) {
      this.clickToStartEl.remove();
      this.clickToStartEl = null;
    }
  }
}
