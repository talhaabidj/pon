import { createDefaultGameState, loadGameState, saveGameState } from '../../core/Save.js';
import { sanitizePlayerSettings } from '../../core/PlayerSettings.js';
import type { PlayerSettings } from '../../data/types.js';

const SETTINGS_UPDATED_EVENT = 'catchapon:settings-updated';

export type RenderQuality = 'min' | 'medium' | 'high';

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

export function persistPauseSettings(
  update: (settings: PlayerSettings) => void,
): PlayerSettings {
  const state = loadGameState() || createDefaultGameState();
  const settings = sanitizePlayerSettings(state.settings);
  update(settings);
  state.settings = sanitizePlayerSettings(settings);
  saveGameState(state);
  return state.settings;
}

export function notifyPauseSettingsUpdated(settings: PlayerSettings) {
  window.dispatchEvent(
    new CustomEvent<{ settings: PlayerSettings }>(SETTINGS_UPDATED_EVENT, {
      detail: { settings },
    }),
  );
}

export function getRenderQualityBounds(
  quality: RenderQuality,
): Pick<PlayerSettings, 'minRenderScale' | 'maxRenderScale'> {
  return RENDER_QUALITY_BOUNDS[quality] ?? RENDER_QUALITY_BOUNDS.medium;
}

export function syncPauseSettingsInputs() {
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
