import { gameAudio } from '../core/Audio.js';
import { loadGameState, saveGameState, createDefaultGameState } from '../core/Save.js';
import { sanitizePlayerSettings } from '../core/PlayerSettings.js';
import type { PlayerSettings } from '../data/types.js';

let hideTimer: number | null = null;

const SETTINGS_UPDATED_EVENT = 'catchapon:settings-updated';

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

function getRenderQuality(settings: PlayerSettings): RenderQuality {
  if (settings.maxRenderScale <= 0.8) return 'min';
  if (settings.maxRenderScale < 0.95) return 'medium';
  return 'high';
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

function syncPauseSettingsInputs() {
  const state = loadGameState() || createDefaultGameState();
  const settings = sanitizePlayerSettings(state.settings);
  const volInput = document.getElementById('pause-settings-volume') as HTMLInputElement | null;
  const volValue = document.getElementById('pause-settings-volume-value');
  const invertInput = document.getElementById('pause-settings-invert') as HTMLInputElement | null;
  const dynamicResolutionInput = document.getElementById(
    'pause-settings-dynamic-resolution',
  ) as HTMLInputElement | null;
  const renderQualityInput = document.getElementById(
    'pause-settings-render-quality',
  ) as HTMLSelectElement | null;

  if (volInput) volInput.value = String(Math.round(settings.masterVolume * 100));
  if (volValue) volValue.textContent = `${Math.round(settings.masterVolume * 100)}%`;
  if (invertInput) invertInput.checked = settings.invertY;
  if (dynamicResolutionInput) {
    dynamicResolutionInput.checked = settings.dynamicResolution;
  }
  if (renderQualityInput) renderQualityInput.value = getRenderQuality(settings);
}

function createInfoSection(title: string, lines: string[]) {
  const section = document.createElement('section');
  section.style.cssText = `
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 0.9rem 1rem;
    min-width: 220px;
  `;

  const heading = document.createElement('h2');
  heading.innerText = title;
  heading.style.cssText = `
    margin: 0 0 0.55rem;
    font-size: 0.98rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: #f7f9ff;
  `;
  section.appendChild(heading);

  const list = document.createElement('ul');
  list.style.cssText = `
    margin: 0;
    padding-left: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.36rem;
    color: #d8dfef;
    font-size: 0.87rem;
    line-height: 1.35;
  `;

  for (const line of lines) {
    const item = document.createElement('li');
    item.innerText = line;
    list.appendChild(item);
  }

  section.appendChild(list);
  return section;
}

export function mountPauseUI() {
  if (document.getElementById('pause-menu')) return;

  const container = document.createElement('div');
  container.id = 'pause-menu';
  container.dataset['open'] = 'false';
  container.setAttribute('aria-hidden', 'true');
  container.style.cssText = `
    position: fixed;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1.2rem;
    background: rgba(8, 10, 16, 0.74);
    backdrop-filter: blur(9px);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity 0.2s ease, visibility 0.2s ease;
    z-index: 1000;
    color: #ffffff;
    font-family: 'Segoe UI', sans-serif;
  `;

  const panel = document.createElement('div');
  panel.id = 'pause-panel';
  panel.style.cssText = `
    width: min(860px, 92vw);
    max-height: 90vh;
    overflow-y: auto;
    background: linear-gradient(145deg, rgba(22, 26, 38, 0.96), rgba(16, 19, 28, 0.94));
    border: 1px solid rgba(200, 214, 255, 0.15);
    border-radius: 16px;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
    padding: 1.4rem 1.5rem;
    transform: translateY(16px) scale(0.985);
    transition: transform 0.2s ease;
  `;

  const title = document.createElement('h1');
  title.innerText = 'Paused';
  title.style.cssText = `
    margin: 0;
    font-size: clamp(2rem, 3.4vw, 2.9rem);
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #f4f7ff;
  `;

  const subtitle = document.createElement('p');
  subtitle.id = 'pause-status';
  subtitle.innerText = 'Press ESC again to close this menu, then click to lock cursor and continue.';
  subtitle.style.cssText = `
    margin: 0.35rem 0 1rem;
    color: #b7c0d6;
    font-size: 0.95rem;
  `;

  const sections = document.createElement('div');
  sections.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 0.9rem;
    margin-bottom: 1.15rem;
  `;

  sections.appendChild(createInfoSection('Controls', [
    'WASD / Arrow Keys: Move',
    'Mouse: Look around',
    'E: Interact with objects',
    'Q: Close active overlay',
    'Left Ctrl: Toggle free cursor',
    'ESC: Open pause menu',
  ]));

  sections.appendChild(createInfoSection('How To Play', [
    'Explore your room and interact with the PC, collection wall, and door.',
    'Start your shift in the shop to earn money and complete tasks.',
    'Spend tokens on machines and expand your gacha collection.',
    'Return home, check progress, and prepare for the next night.',
  ]));

  const settingsSection = document.createElement('section');
  settingsSection.style.cssText = `
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 0.9rem 1rem;
    min-width: 220px;
  `;
  settingsSection.innerHTML = `
    <h2 style="margin: 0 0 0.6rem; font-size: 0.98rem; font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase; color: #f7f9ff;">Settings</h2>
    <div style="display: flex; flex-direction: column; gap: 0.62rem;">
      <label style="display: flex; justify-content: space-between; align-items: center; gap: 0.6rem; color: #d8dfef; font-size: 0.87rem;">
        <span>Master Volume</span>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <input type="range" id="pause-settings-volume" min="0" max="100" step="1" />
          <span id="pause-settings-volume-value" style="min-width: 42px; text-align: right; font-family: monospace;">80%</span>
        </div>
      </label>
      <label style="display: flex; justify-content: space-between; align-items: center; gap: 0.6rem; color: #d8dfef; font-size: 0.87rem;">
        <span>Mouse Invert Y</span>
        <input type="checkbox" id="pause-settings-invert" />
      </label>
      <label style="display: flex; justify-content: space-between; align-items: center; gap: 0.6rem; color: #d8dfef; font-size: 0.87rem;">
        <span>Adaptive Resolution</span>
        <input type="checkbox" id="pause-settings-dynamic-resolution" />
      </label>
      <label style="display: flex; justify-content: space-between; align-items: center; gap: 0.6rem; color: #d8dfef; font-size: 0.87rem;">
        <span>Render Quality</span>
        <select id="pause-settings-render-quality" style="min-width: 132px;">
          <option value="min">Min</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </label>
    </div>
  `;
  sections.appendChild(settingsSection);

  const btnContainer = document.createElement('div');
  btnContainer.style.cssText = `
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
    width: 100%;
  `;

  const btnStyle = `
    flex: 1 1 220px;
    padding: 0.9rem 1.2rem;
    font-size: 1rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.14);
    color: #f8fbff;
    border-radius: 10px;
    cursor: pointer;
    transition: transform 0.14s ease, background-color 0.14s ease;
  `;

  const resumeBtn = document.createElement('button');
  resumeBtn.innerText = 'Resume Game';
  resumeBtn.id = 'pause-resume-btn';
  resumeBtn.style.cssText = btnStyle;
  resumeBtn.onmouseenter = () => {
    resumeBtn.style.background = 'rgba(203, 225, 255, 0.2)';
    resumeBtn.style.transform = 'translateY(-1px)';
  };
  resumeBtn.onmouseleave = () => {
    resumeBtn.style.background = 'rgba(255, 255, 255, 0.06)';
    resumeBtn.style.transform = 'none';
  };

  const quitBtn = document.createElement('button');
  quitBtn.innerText = 'Quit to Start';
  quitBtn.id = 'pause-quit-btn';
  quitBtn.style.cssText = btnStyle;
  quitBtn.onmouseenter = () => {
    quitBtn.style.background = 'rgba(255, 90, 90, 0.2)';
    quitBtn.style.transform = 'translateY(-1px)';
  };
  quitBtn.onmouseleave = () => {
    quitBtn.style.background = 'rgba(255, 255, 255, 0.06)';
    quitBtn.style.transform = 'none';
  };
  quitBtn.onclick = () => {
    window.location.reload();
  };

  btnContainer.appendChild(resumeBtn);
  btnContainer.appendChild(quitBtn);

  panel.appendChild(title);
  panel.appendChild(subtitle);
  panel.appendChild(sections);
  panel.appendChild(btnContainer);
  container.appendChild(panel);

  document.body.appendChild(container);

  const volInput = document.getElementById('pause-settings-volume') as HTMLInputElement | null;
  const volValue = document.getElementById('pause-settings-volume-value');
  const invertInput = document.getElementById('pause-settings-invert') as HTMLInputElement | null;
  const dynamicResolutionInput = document.getElementById(
    'pause-settings-dynamic-resolution',
  ) as HTMLInputElement | null;
  const renderQualityInput = document.getElementById(
    'pause-settings-render-quality',
  ) as HTMLSelectElement | null;

  if (volInput) {
    volInput.addEventListener('input', (event) => {
      const nextValue = parseInt((event.target as HTMLInputElement).value, 10);
      if (volValue) volValue.textContent = `${nextValue}%`;
    });
    volInput.addEventListener('change', (event) => {
      const nextValue = parseInt((event.target as HTMLInputElement).value, 10);
      const nextSettings = updatePersistedSettings((settings) => {
        settings.masterVolume = nextValue / 100;
      });
      gameAudio.syncSettings();
      broadcastSettings(nextSettings);
    });
  }

  if (invertInput) {
    invertInput.addEventListener('change', (event) => {
      const checked = (event.target as HTMLInputElement).checked;
      const nextSettings = updatePersistedSettings((settings) => {
        settings.invertY = checked;
      });
      broadcastSettings(nextSettings);
    });
  }

  if (dynamicResolutionInput) {
    dynamicResolutionInput.addEventListener('change', (event) => {
      const checked = (event.target as HTMLInputElement).checked;
      const nextSettings = updatePersistedSettings((settings) => {
        settings.dynamicResolution = checked;
      });
      broadcastSettings(nextSettings);
    });
  }

  if (renderQualityInput) {
    renderQualityInput.addEventListener('change', (event) => {
      const quality = (event.target as HTMLSelectElement).value as RenderQuality;
      const bounds = RENDER_QUALITY_BOUNDS[quality] ?? RENDER_QUALITY_BOUNDS.medium;
      const nextSettings = updatePersistedSettings((settings) => {
        settings.minRenderScale = bounds.minRenderScale;
        settings.maxRenderScale = bounds.maxRenderScale;
      });
      broadcastSettings(nextSettings);
    });
  }

  syncPauseSettingsInputs();
}

export function unmountPauseUI() {
  if (hideTimer != null) {
    window.clearTimeout(hideTimer);
    hideTimer = null;
  }
  document.getElementById('pause-menu')?.remove();
}

export function showPauseMenu(
  onResumeCallback: () => void,
) {
  const menu = document.getElementById('pause-menu');
  const panel = document.getElementById('pause-panel');
  if (!menu || !panel) return;

  if (hideTimer != null) {
    window.clearTimeout(hideTimer);
    hideTimer = null;
  }

  menu.dataset['open'] = 'true';
  menu.setAttribute('aria-hidden', 'false');
  menu.style.visibility = 'visible';
  menu.style.pointerEvents = 'auto';
  syncPauseSettingsInputs();
  setPauseResumePending(false);
  setPauseResumeMessage(
    'Press ESC again to close this menu, then click to lock cursor and continue.',
  );

  requestAnimationFrame(() => {
    menu.style.opacity = '1';
    panel.style.transform = 'translateY(0) scale(1)';
  });

  const resumeBtn = document.getElementById('pause-resume-btn') as HTMLButtonElement | null;
  if (resumeBtn) {
    const requestResume = () => {
      if (menu.dataset['open'] !== 'true') return;
      onResumeCallback();
    };
    resumeBtn.onpointerdown = (event) => {
      event.preventDefault();
      requestResume();
    };
    resumeBtn.onclick = requestResume;
    resumeBtn.onkeydown = (event) => {
      if (event.code !== 'Enter' && event.code !== 'Space') return;
      event.preventDefault();
      requestResume();
    };
    resumeBtn.focus({ preventScroll: true });
  }
}

export function hidePauseMenu() {
  const menu = document.getElementById('pause-menu');
  const panel = document.getElementById('pause-panel');
  if (!menu || !panel) return;

  menu.dataset['open'] = 'false';
  menu.setAttribute('aria-hidden', 'true');
  menu.style.opacity = '0';
  menu.style.pointerEvents = 'none';
  panel.style.transform = 'translateY(16px) scale(0.985)';

  if (hideTimer != null) {
    window.clearTimeout(hideTimer);
  }
  hideTimer = window.setTimeout(() => {
    if (menu.dataset['open'] !== 'true') {
      menu.style.visibility = 'hidden';
    }
    hideTimer = null;
  }, 210);
}

export function isPauseMenuVisible(): boolean {
  return document.getElementById('pause-menu')?.dataset['open'] === 'true';
}

export function setPauseResumePending(isPending: boolean) {
  const resumeBtn = document.getElementById('pause-resume-btn') as HTMLButtonElement | null;
  if (!resumeBtn) return;

  resumeBtn.disabled = isPending;
  resumeBtn.innerText = isPending ? 'Locking Cursor...' : 'Resume Game';
  resumeBtn.style.cursor = isPending ? 'wait' : 'pointer';
  resumeBtn.style.opacity = isPending ? '0.72' : '1';
}

export function setPauseResumeMessage(message: string) {
  const status = document.getElementById('pause-status');
  if (status) status.innerText = message;
}
