/**
 * desktopUI — Mounts and unmounts the fake OS desktop overlay.
 *
 * Provides Start Shift, Profile, Collection, Settings buttons
 * styled as a cozy dark OS with neon accent highlights.
 */

import type { Game } from '../core/Game.js';

const DESKTOP_ID = 'desktop-ui';

/** Mount the desktop UI into #ui-root */
export function mountDesktopUI(game: Game) {
  const uiRoot = document.getElementById('ui-root');
  if (!uiRoot) return;

  const container = document.createElement('div');
  container.id = DESKTOP_ID;
  container.innerHTML = `
    <div class="desktop-screen">
      <div class="desktop-taskbar">
        <div class="taskbar-left">
          <span class="taskbar-logo">⬡ Catchapon OS</span>
        </div>
        <div class="taskbar-right">
          <span class="taskbar-clock" id="desktop-clock"></span>
        </div>
      </div>
      <div class="desktop-content">
        <div class="desktop-icons">
          <button class="desktop-icon" id="btn-start-shift">
            <div class="icon-glyph">🌙</div>
            <span class="icon-label">Night Shift</span>
          </button>
          <button class="desktop-icon" id="btn-profile">
            <div class="icon-glyph">👤</div>
            <span class="icon-label">Profile</span>
          </button>
          <button class="desktop-icon" id="btn-collection">
            <div class="icon-glyph">🎯</div>
            <span class="icon-label">Collection</span>
          </button>
          <button class="desktop-icon" id="btn-settings">
            <div class="icon-glyph">⚙️</div>
            <span class="icon-label">Settings</span>
          </button>
        </div>
        <div class="desktop-hero">
          <h1 class="hero-title">Catchapon</h1>
          <p class="hero-subtitle">Night Shift Gacha</p>
          <div class="hero-divider"></div>
          <p class="hero-hint">Select <strong>Night Shift</strong> to begin</p>
        </div>
      </div>
    </div>
  `;

  uiRoot.appendChild(container);

  // —— Transition effect on Start Shift ——
  const startBtn = document.getElementById('btn-start-shift');
  startBtn?.addEventListener('click', () => {
    handleStartShift(game, container);
  });

  // —— Update clock ——
  updateClock();
  const clockInterval = setInterval(updateClock, 1000);
  container.dataset['clockInterval'] = String(clockInterval);
}

/** Unmount the desktop UI */
export function unmountDesktopUI() {
  const el = document.getElementById(DESKTOP_ID);
  if (el) {
    const interval = el.dataset['clockInterval'];
    if (interval) clearInterval(Number(interval));
    el.remove();
  }
}

// —— Internal helpers ——

function handleStartShift(game: Game, container: HTMLElement) {
  // Add dive animation class
  container.classList.add('desktop-dive');

  // After animation, transition to BedroomScene
  setTimeout(async () => {
    // Dynamic import to avoid circular dependency
    const { BedroomScene } = await import('../scenes/BedroomScene.js');
    await game.sceneManager.switchTo(new BedroomScene(game));
  }, 800);
}

function updateClock() {
  const clockEl = document.getElementById('desktop-clock');
  if (!clockEl) return;
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
