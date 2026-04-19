/**
 * desktopUI — Mounts and unmounts the fake OS desktop overlay.
 *
 * Provides Start Shift, Profile, Collection, Settings buttons
 * styled as a cozy dark OS with neon accent highlights.
 */

import type { Game } from '../core/Game.js';
import { loadGameState, saveGameState, createDefaultGameState } from '../core/Save.js';

// If Howler is present in their node_modules, this binds global audio.
// If not installed yet, this will error in Vite until user installs it, as per M14 reqs.
// @ts-expect-error - Ignore missing types if they haven't installed @types/howler yet
import * as HowlerModule from 'howler';

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
          <button class="desktop-icon" id="btn-faq">
            <div class="icon-glyph">📖</div>
            <span class="icon-label">Help / FAQ</span>
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
    
    <div id="desktop-overlays" style="display: none; position: absolute; inset: 0; background: rgba(5,5,10,0.9); z-index: 100; backdrop-filter: blur(10px); color: white; flex-direction: column; padding: 3rem; overflow-y: auto;">
      <button id="btn-close-overlay" style="align-self: flex-start; padding: 0.5rem 1.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; cursor: pointer; border-radius: 4px; margin-bottom: 2rem;">← Back to Desktop</button>
      
      <div id="overlay-profile" style="display: none;">
        <h2 style="font-size: 2.5rem; margin-bottom: 1rem; color: #7c6ef0;">User Profile</h2>
        <p style="color: #aaa; font-size: 1.2rem;">Local profile data loaded. Your performance metrics are recorded during shift hours.</p>
        <div style="margin-top: 2rem; display: flex; gap: 2rem;">
          <div style="background: rgba(255,255,255,0.05); padding: 2rem; border-radius: 8px;">
            <h3>Operator Level: <span style="color: white;">Sr. Staff</span></h3>
          </div>
          <div style="background: rgba(255,255,255,0.05); padding: 2rem; border-radius: 8px;">
            <h3>Clearance: <span style="color: white;">Class B</span></h3>
          </div>
        </div>
      </div>

      <div id="overlay-collection" style="display: none;">
        <h2 style="font-size: 2.5rem; margin-bottom: 1rem; color: #7c6ef0;">Collection Status</h2>
        <p style="color: #aaa; font-size: 1.2rem;">Boot up your bedroom PC console or access the bedroom wall directly to view detailed collectible albums.</p>
        <div style="margin-top: 2rem; background: rgba(255,255,255,0.05); padding: 2rem; border-radius: 8px;">
          <p>Local Collection Registry is currently syncing...</p>
        </div>
      </div>

      <div id="overlay-settings" style="display: none;">
        <h2 style="font-size: 2.5rem; margin-bottom: 1rem; color: #7c6ef0;">System Settings</h2>
        <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 2rem;">
          <label style="display: flex; justify-content: space-between; max-width: 400px;">
            <span>Master Volume</span>
            <input type="range" id="settings-volume" min="0" max="100" value="80" />
          </label>
          <label style="display: flex; justify-content: space-between; max-width: 400px;">
            <span>Mouse Invert Y</span>
            <input type="checkbox" id="settings-invert" />
          </label>
          <label style="display: flex; justify-content: space-between; max-width: 400px;">
            <span>Graphics Quality</span>
            <select disabled><option>Ultra</option></select>
          </label>
          <p style="margin-top: 1rem; color: #666; font-size: 0.9rem;">(System settings are locked by Administrator)</p>
        </div>
      </div>

      <div id="overlay-faq" style="display: none;">
        <h2 style="font-size: 2.5rem; margin-bottom: 1rem; color: #7c6ef0;">Catchapon - Help & FAQ</h2>
        <div style="max-width: 800px; color: #ccc; font-size: 1.1rem; line-height: 1.6;">
          <p>Welcome to <strong>Catchapon</strong>, a premium browser aesthetic game offering a blend of a virtual gacha pull simulator and a cozy life sim natively built with Three.js and Vite.</p>
          <h3 style="color: white; margin-top: 2rem;">What is my objective in this aesthetic neon webgl experience?</h3>
          <p>Your job requires you to tackle the fast-paced challenges of a night shift management simulator. You will clean up dirty floor spots (mop tasks), rewire disconnected plugs, fix mechanical jams, and wipe the glass on broken capsule machines to keep the shop running perfectly.</p>
          <h3 style="color: white; margin-top: 1.5rem;">How do I become a 3D capsule toy collector?</h3>
          <p>As you complete your maintenance tasks, you'll earn money efficiently. Spend this money at the Token Exchange machine to grab golden tokens. Insert your tokens into fully functional gacha machines to act as a mystery box unlocker, allowing you to pull and collect rare digital capsule toys!</p>
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

  // —— Overlay Routing ——
  const overlays = document.getElementById('desktop-overlays')!;
  const btnClose = document.getElementById('btn-close-overlay')!;
  const allViews = ['overlay-profile', 'overlay-collection', 'overlay-settings', 'overlay-faq'];

  const openOverlay = (id: string) => {
    overlays.style.display = 'flex';
    allViews.forEach(v => {
      document.getElementById(v)!.style.display = v === id ? 'block' : 'none';
    });
  };

  document.getElementById('btn-profile')?.addEventListener('click', () => openOverlay('overlay-profile'));
  document.getElementById('btn-collection')?.addEventListener('click', () => openOverlay('overlay-collection'));
  document.getElementById('btn-settings')?.addEventListener('click', () => {
    openOverlay('overlay-settings');
    // Load current config into inputs
    const state = loadGameState() || createDefaultGameState();
    const volInput = document.getElementById('settings-volume') as HTMLInputElement;
    const invInput = document.getElementById('settings-invert') as HTMLInputElement;
    
    if (volInput) volInput.value = String((state.settings.masterVolume ?? 0.8) * 100);
    if (invInput) invInput.checked = state.settings.invertY ?? false;
  });
  document.getElementById('btn-faq')?.addEventListener('click', () => openOverlay('overlay-faq'));

  btnClose.addEventListener('click', () => {
    overlays.style.display = 'none';
  });

  // —— Wire Settings Persistence ——
  const volInput = document.getElementById('settings-volume') as HTMLInputElement;
  const invInput = document.getElementById('settings-invert') as HTMLInputElement;

  if (volInput) {
    volInput.addEventListener('change', (e) => {
      const val = parseInt((e.target as HTMLInputElement).value, 10);
      const state = loadGameState() || createDefaultGameState();
      state.settings.masterVolume = val / 100;
      saveGameState(state);
      
      // Update Howler Globally
      if (HowlerModule && HowlerModule.Howler) {
          HowlerModule.Howler.volume(state.settings.masterVolume);
      }
    });
  }

  if (invInput) {
    invInput.addEventListener('change', (e) => {
      const val = (e.target as HTMLInputElement).checked;
      const state = loadGameState() || createDefaultGameState();
      state.settings.invertY = val;
      saveGameState(state);
    });
  }

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
