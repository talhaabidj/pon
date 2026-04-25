import { gameAudio } from '../core/Audio.js';
import { resetPlayerData } from '../core/Save.js';
import { createPauseInfoSection } from './pause/pauseInfoSection.js';
import {
  getRenderQualityBounds,
  notifyPauseSettingsUpdated,
  persistPauseSettings,
  syncPauseSettingsInputs,
  type RenderQuality,
} from './pause/pauseSettings.js';

let hideTimer: number | null = null;

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
    border: 1px solid var(--info-card-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    padding: 1.4rem 1.5rem;
    transform: translateY(16px) scale(0.985);
    transition: transform 0.2s ease;
  `;

  const title = document.createElement('h1');
  title.className = 'info-heading';
  title.innerText = 'Paused';
  title.style.textTransform = 'uppercase';
  title.style.margin = '0';

  const subtitle = document.createElement('p');
  subtitle.id = 'pause-status';
  subtitle.className = 'info-card-body';
  subtitle.innerText = 'Press ESC again to close this menu, then click to lock cursor and continue.';
  subtitle.style.margin = '0.35rem 0 1rem';

  const sections = document.createElement('div');
  sections.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 0.9rem;
    margin-bottom: 1.15rem;
  `;

  sections.appendChild(createPauseInfoSection('Controls', [
    'WASD / Arrow Keys: Move',
    'Mouse: Look around',
    'E: Interact with objects',
    'R: Service machines',
    'Q: Close active overlay',
    'Left Ctrl: Toggle free cursor',
    'ESC: Open pause menu',
  ]));

  sections.appendChild(createPauseInfoSection('How To Play', [
    'Explore your room and interact with the PC, collection wall, and door.',
    'Start your shift in the shop to earn money and complete tasks.',
    'Spend tokens on machines and expand your gacha collection.',
    'Return home, check progress, and prepare for the next night.',
  ]));

  const settingsSection = document.createElement('section');
  settingsSection.className = 'info-card';
  settingsSection.innerHTML = `
    <h2 class="info-section-heading">Settings</h2>
    <div class="settings-control-list">
      <label class="settings-row">
        <span>Master Volume</span>
        <div class="settings-row-value">
          <input type="range" id="pause-settings-volume" min="0" max="100" step="1" />
          <span id="pause-settings-volume-value" class="info-card-mono settings-row-readout">80%</span>
        </div>
      </label>
      <label class="settings-row">
        <span>Mouse Invert Y</span>
        <input type="checkbox" id="pause-settings-invert" />
      </label>
      <label class="settings-row">
        <span>Adaptive Resolution</span>
        <input type="checkbox" id="pause-settings-dynamic-resolution" />
      </label>
      <label class="settings-row">
        <span>Render Quality</span>
        <select id="pause-settings-render-quality" class="settings-row-select">
          <option value="min">Min</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </label>
      <button id="pause-settings-reset-data" class="settings-danger-btn">
        Reset Player Data
      </button>
      <p class="info-card-body settings-danger-note">Clears all progress and restarts the game.</p>
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

  const resumeBtn = document.createElement('button');
  resumeBtn.innerText = 'Resume Game';
  resumeBtn.id = 'pause-resume-btn';
  resumeBtn.className = 'pause-action-btn';

  const quitBtn = document.createElement('button');
  quitBtn.innerText = 'Quit to Start';
  quitBtn.id = 'pause-quit-btn';
  quitBtn.className = 'pause-action-btn pause-action-btn--danger';
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
  const resetDataButton = document.getElementById(
    'pause-settings-reset-data',
  ) as HTMLButtonElement | null;

  if (volInput) {
    volInput.addEventListener('input', (event) => {
      const nextValue = parseInt((event.target as HTMLInputElement).value, 10);
      if (volValue) volValue.textContent = `${nextValue}%`;
    });
    volInput.addEventListener('change', (event) => {
      const nextValue = parseInt((event.target as HTMLInputElement).value, 10);
      const nextSettings = persistPauseSettings((settings) => {
        settings.masterVolume = nextValue / 100;
      });
      gameAudio.syncSettings();
      notifyPauseSettingsUpdated(nextSettings);
    });
  }

  if (invertInput) {
    invertInput.addEventListener('change', (event) => {
      const checked = (event.target as HTMLInputElement).checked;
      const nextSettings = persistPauseSettings((settings) => {
        settings.invertY = checked;
      });
      notifyPauseSettingsUpdated(nextSettings);
    });
  }

  if (dynamicResolutionInput) {
    dynamicResolutionInput.addEventListener('change', (event) => {
      const checked = (event.target as HTMLInputElement).checked;
      const nextSettings = persistPauseSettings((settings) => {
        settings.dynamicResolution = checked;
      });
      notifyPauseSettingsUpdated(nextSettings);
    });
  }

  if (renderQualityInput) {
    renderQualityInput.addEventListener('change', (event) => {
      const quality = (event.target as HTMLSelectElement).value as RenderQuality;
      const bounds = getRenderQualityBounds(quality);
      const nextSettings = persistPauseSettings((settings) => {
        settings.minRenderScale = bounds.minRenderScale;
        settings.maxRenderScale = bounds.maxRenderScale;
      });
      notifyPauseSettingsUpdated(nextSettings);
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
