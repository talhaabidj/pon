/**
 * desktopUI — Mounts and unmounts the fake OS desktop overlay.
 *
 * Provides Start Shift, Profile, Collection, Settings buttons
 * styled as a cozy dark OS with neon accent highlights.
 */

import { gameAudio } from '../core/Audio.js';
import { formatCurrency } from '../core/Currency.js';
import {
  loadGameState,
  saveGameState,
  createDefaultGameState,
  resetPlayerData,
} from '../core/Save.js';
import { sanitizePlayerSettings } from '../core/PlayerSettings.js';
import type { PlayerSettings } from '../data/types.js';
import { SETS } from '../data/sets.js';
import { ITEMS } from '../data/items.js';

const DESKTOP_ID = 'desktop-ui';
const SETTINGS_UPDATED_EVENT = 'catchapon:settings-updated';
let howlerModulePromise: Promise<typeof import('howler') | null> | null = null;

export interface DesktopUIIntents {
  onStartNightShift: () => Promise<void> | void;
}

type RenderQuality = 'min' | 'medium' | 'high';

const RENDER_QUALITY_BOUNDS: Record<
  RenderQuality,
  Pick<PlayerSettings, 'minRenderScale' | 'maxRenderScale'>
> = {
  min: {
    minRenderScale: 0.58,
    maxRenderScale: 0.78,
  },
  medium: {
    minRenderScale: 0.68,
    maxRenderScale: 0.9,
  },
  high: {
    minRenderScale: 0.75,
    maxRenderScale: 1.0,
  },
};

function loadHowlerModule() {
  // Lazy-load Howler only when settings actually need it.
  // This keeps desktop boot JS lighter for better LCP/INP.
  if (!howlerModulePromise) {
    howlerModulePromise = import('howler').catch(() => null);
  }
  return howlerModulePromise;
}

function updatePersistedSettings(
  update: (settings: PlayerSettings) => void,
): PlayerSettings {
  const state = loadGameState() || createDefaultGameState();
  const settings = sanitizePlayerSettings(state.settings);
  update(settings);
  state.settings = sanitizePlayerSettings(settings);
  saveGameState(state);
  return state.settings;
}

function broadcastSettings(settings: PlayerSettings) {
  window.dispatchEvent(
    new CustomEvent<{ settings: PlayerSettings }>(SETTINGS_UPDATED_EVENT, {
      detail: { settings },
    }),
  );
}

function getRenderQuality(settings: PlayerSettings): RenderQuality {
  if (settings.maxRenderScale <= 0.8) return 'min';
  if (settings.maxRenderScale < 0.95) return 'medium';
  return 'high';
}

/** Mount the desktop UI into #ui-root */
export function mountDesktopUI(intents: DesktopUIIntents) {
  const uiRoot = document.getElementById('ui-root');
  if (!uiRoot) return;

  const container = document.createElement('div');
  container.id = DESKTOP_ID;
  const zeroCurrency = formatCurrency(0);
  container.innerHTML = `
    <div class="desktop-screen">
      <div class="desktop-taskbar">
        <div class="taskbar-left">
          <span class="taskbar-logo">
            <img src="/logo.png?v=20260419-2" alt="Logo" class="taskbar-img" /> Catchapon OS
          </span>
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
          <img src="/logo.png?v=20260419-2" alt="Catchapon Logo" class="hero-logo" />
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
        <h2 style="font-size: 2rem; margin-bottom: 1rem; color: #f4f7ff; letter-spacing: 0.03em;">Profile</h2>
        <div style="display: flex; flex-direction: column; gap: 0.7rem; max-width: 560px;">
          <div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.12); border-radius:8px; padding:0.8rem 1rem;"><span style="color:#a8b0c4;">Nights Worked</span><span id="desktop-stat-nights" style="color:#7c6ef0; font-family: monospace;">0</span></div>
          <div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.12); border-radius:8px; padding:0.8rem 1rem;"><span style="color:#a8b0c4;">Total Credits Earned</span><span id="desktop-stat-money" style="color:#7c6ef0; font-family: monospace;">${zeroCurrency}</span></div>
          <div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.12); border-radius:8px; padding:0.8rem 1rem;"><span style="color:#a8b0c4;">Current Credits</span><span id="desktop-stat-wallet" style="color:#7c6ef0; font-family: monospace;">${zeroCurrency}</span></div>
          <div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.12); border-radius:8px; padding:0.8rem 1rem;"><span style="color:#a8b0c4;">Items Collected</span><span id="desktop-stat-items" style="color:#7c6ef0; font-family: monospace;">0 / ${ITEMS.length}</span></div>
          <div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.12); border-radius:8px; padding:0.8rem 1rem;"><span style="color:#a8b0c4;">Sets Completed</span><span id="desktop-stat-sets" style="color:#7c6ef0; font-family: monospace;">0 / ${SETS.length}</span></div>
        </div>
      </div>

      <div id="overlay-collection" style="display: none;">
        <h2 style="font-size: 2rem; margin-bottom: 1rem; color: #f4f7ff; letter-spacing: 0.03em;">Collection</h2>
        <div style="display: flex; flex-direction: column; gap: 0.7rem; max-width: 640px;">
          <div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.12); border-radius:8px; padding:0.8rem 1rem;"><span style="color:#a8b0c4;">Total Collected</span><span id="desktop-collection-total" style="color:#7c6ef0; font-family: monospace;">0 / ${ITEMS.length}</span></div>
          <div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.12); border-radius:8px; padding:0.8rem 1rem;"><span style="color:#a8b0c4;">Sets Completed</span><span id="desktop-collection-completed" style="color:#7c6ef0; font-family: monospace;">0 / ${SETS.length}</span></div>
          <div id="desktop-collection-sets" style="display:flex; flex-direction: column; gap: 0.55rem; margin-top: 0.2rem;"></div>
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
            <span>Adaptive Resolution</span>
            <input type="checkbox" id="settings-dynamic-resolution" />
          </label>
          <label style="display: flex; justify-content: space-between; max-width: 400px;">
            <span>Render Quality</span>
            <select id="settings-render-quality" style="min-width: 170px;">
              <option value="min">Min</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <p style="margin-top: 0.6rem; color: #a9b0c7; font-size: 0.9rem; max-width: 480px;">Adaptive resolution stays on by default. Quality controls the adaptive render scale range.</p>
          <button
            id="settings-reset-data"
            style="margin-top: 0.8rem; max-width: 260px; padding: 0.55rem 0.9rem; border-radius: 6px; border: 1px solid rgba(255,120,120,0.52); background: rgba(120,20,20,0.28); color: #ffd2d2; cursor: pointer;"
          >
            Reset Player Data
          </button>
          <p style="margin-top: 0.2rem; color: #c7a5a5; font-size: 0.82rem; max-width: 520px;">Deletes progress, credits, tokens, collection, secrets, and settings.</p>
        </div>
      </div>

      <div id="overlay-faq" style="display: none;">
        <h2 style="font-size: 2.5rem; margin-bottom: 1rem; color: #7c6ef0;">Catchapon - Help & FAQ</h2>
        <div style="max-width: 800px; color: #ccc; font-size: 1.1rem; line-height: 1.6;">
          <p>Welcome to <strong>Catchapon</strong>, a premium browser aesthetic game offering a blend of a virtual gacha pull simulator and a cozy life sim natively built with Three.js and Vite.</p>
          <h3 style="color: white; margin-top: 2rem;">What is my objective in this aesthetic neon webgl experience?</h3>
          <p>Your job requires you to tackle the fast-paced challenges of a night shift management simulator. You will clean floor messes (mud splashes and trash), rewire disconnected plugs, fix mechanical jams, and wipe the glass on broken capsule machines to keep the shop running perfectly.</p>
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
    void handleStartShift(intents.onStartNightShift, container);
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

    if (id === 'overlay-profile') {
      updateDesktopProfileStats();
    }
    if (id === 'overlay-collection') {
      updateDesktopCollectionStats();
    }
  };

  document.getElementById('btn-profile')?.addEventListener('click', () => openOverlay('overlay-profile'));
  document.getElementById('btn-collection')?.addEventListener('click', () => openOverlay('overlay-collection'));
  document.getElementById('btn-settings')?.addEventListener('click', () => {
    openOverlay('overlay-settings');
    // Load current config into inputs
    const state = loadGameState() || createDefaultGameState();
    const settings = sanitizePlayerSettings(state.settings);
    const volInput = document.getElementById('settings-volume') as HTMLInputElement;
    const invInput = document.getElementById('settings-invert') as HTMLInputElement;
    const dynamicResolutionInput = document.getElementById(
      'settings-dynamic-resolution',
    ) as HTMLInputElement;
    const renderQualityInput = document.getElementById(
      'settings-render-quality',
    ) as HTMLSelectElement;

    if (volInput) volInput.value = String(Math.round(settings.masterVolume * 100));
    if (invInput) invInput.checked = settings.invertY;
    if (dynamicResolutionInput) dynamicResolutionInput.checked = settings.dynamicResolution;
    if (renderQualityInput) renderQualityInput.value = getRenderQuality(settings);
  });
  document.getElementById('btn-faq')?.addEventListener('click', () => openOverlay('overlay-faq'));

  btnClose.addEventListener('click', () => {
    overlays.style.display = 'none';
  });

  // —— Wire Settings Persistence ——
  const volInput = document.getElementById('settings-volume') as HTMLInputElement;
  const invInput = document.getElementById('settings-invert') as HTMLInputElement;
  const dynamicResolutionInput = document.getElementById(
    'settings-dynamic-resolution',
  ) as HTMLInputElement;
  const renderQualityInput = document.getElementById(
    'settings-render-quality',
  ) as HTMLSelectElement;
  const resetDataButton = document.getElementById(
    'settings-reset-data',
  ) as HTMLButtonElement;

  if (volInput) {
    volInput.addEventListener('change', (e) => {
      const val = parseInt((e.target as HTMLInputElement).value, 10);
      const nextSettings = updatePersistedSettings((settings) => {
        settings.masterVolume = val / 100;
      });

      // Update Howler globally only when/if the library is present.
      void loadHowlerModule().then((howler) => {
        howler?.Howler?.volume(nextSettings.masterVolume);
      });
      gameAudio.syncSettings();
      broadcastSettings(nextSettings);
    });
  }

  if (invInput) {
    invInput.addEventListener('change', (e) => {
      const val = (e.target as HTMLInputElement).checked;
      const nextSettings = updatePersistedSettings((settings) => {
        settings.invertY = val;
      });
      broadcastSettings(nextSettings);
    });
  }

  if (dynamicResolutionInput) {
    dynamicResolutionInput.addEventListener('change', (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      const nextSettings = updatePersistedSettings((settings) => {
        settings.dynamicResolution = checked;
      });
      broadcastSettings(nextSettings);
    });
  }

  if (renderQualityInput) {
    renderQualityInput.addEventListener('change', (e) => {
      const quality = (e.target as HTMLSelectElement).value as RenderQuality;
      const bounds = RENDER_QUALITY_BOUNDS[quality] ?? RENDER_QUALITY_BOUNDS.medium;
      const nextSettings = updatePersistedSettings((settings) => {
        settings.minRenderScale = bounds.minRenderScale;
        settings.maxRenderScale = bounds.maxRenderScale;
      });
      broadcastSettings(nextSettings);
    });
  }

  if (resetDataButton) {
    resetDataButton.addEventListener('click', () => {
      const confirmed = window.confirm(
        'Reset all player data? This permanently clears progress, tokens, credits, and settings.',
      );
      if (!confirmed) return;

      const resetSuccess = resetPlayerData();
      if (!resetSuccess) {
        window.alert('Could not reset player data. Please try again.');
        return;
      }

      window.alert('Player data reset. Restarting game now.');
      window.location.reload();
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

async function handleStartShift(
  onStartNightShift: () => Promise<void> | void,
  container: HTMLElement,
) {
  gameAudio.play('transition');

  // Add dive animation class
  container.classList.add('desktop-dive');

  await new Promise((resolve) => {
    setTimeout(resolve, 800);
  });
  await onStartNightShift();
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

function updateDesktopProfileStats() {
  const state = loadGameState() || createDefaultGameState();

  let completedSets = 0;
  for (const set of SETS) {
    const owned = set.itemIds.filter((id) => state.ownedItemIds.includes(id));
    if (owned.length === set.itemIds.length) completedSets += 1;
  }

  const nights = document.getElementById('desktop-stat-nights');
  const money = document.getElementById('desktop-stat-money');
  const wallet = document.getElementById('desktop-stat-wallet');
  const items = document.getElementById('desktop-stat-items');
  const sets = document.getElementById('desktop-stat-sets');

  if (nights) nights.textContent = String(state.nightsWorked);
  if (money) money.textContent = formatCurrency(state.totalMoneyEarned);
  if (wallet) wallet.textContent = formatCurrency(state.money);
  if (items) items.textContent = `${state.ownedItemIds.length} / ${ITEMS.length}`;
  if (sets) sets.textContent = `${completedSets} / ${SETS.length}`;
}

function updateDesktopCollectionStats() {
  const state = loadGameState() || createDefaultGameState();
  const ownedItemIds = new Set(state.ownedItemIds);

  const totalEl = document.getElementById('desktop-collection-total');
  const completedEl = document.getElementById('desktop-collection-completed');
  const setsEl = document.getElementById('desktop-collection-sets');

  let completedSets = 0;
  const rows: string[] = [];
  for (const set of SETS) {
    const ownedInSet = set.itemIds.filter((id) => ownedItemIds.has(id)).length;
    if (ownedInSet === set.itemIds.length) completedSets += 1;
    rows.push(
      `<div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:0.65rem 0.9rem;"><span style="color:#b8c0d4;">${set.name}</span><span style="color:#d8dcff; font-family: monospace;">${ownedInSet} / ${set.itemIds.length}</span></div>`,
    );
  }

  if (totalEl) totalEl.textContent = `${state.ownedItemIds.length} / ${ITEMS.length}`;
  if (completedEl) completedEl.textContent = `${completedSets} / ${SETS.length}`;
  if (setsEl) setsEl.innerHTML = rows.join('');
}
