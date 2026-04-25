import type { PerformanceSnapshot } from '../core/PerformanceMetrics.js';

const PERFORMANCE_HUD_ID = 'performance-hud';
const PERFORMANCE_HUD_CONTENT_ID = 'performance-hud-content';

function resolveHUDHost(): HTMLElement {
  return document.getElementById('ui-root') ?? document.body;
}

function syncHUDLayout(hud: HTMLElement) {
  if (hud.parentElement !== resolveHUDHost()) {
    resolveHUDHost().appendChild(hud);
  }
  hud.dataset['layout'] = document.getElementById('shop-hud') ? 'shop' : 'default';
}

function formatPing(snapshot: PerformanceSnapshot): string {
  if (snapshot.pingMs == null) return 'n/a';
  return `${Math.round(snapshot.pingMs)} ms`;
}

export function mountPerformanceHUD() {
  if (document.getElementById(PERFORMANCE_HUD_ID)) return;

  const hud = document.createElement('aside');
  hud.id = PERFORMANCE_HUD_ID;
  hud.dataset['open'] = 'false';
  hud.dataset['layout'] = 'default';
  hud.setAttribute('aria-hidden', 'true');

  const content = document.createElement('div');
  content.id = PERFORMANCE_HUD_CONTENT_ID;
  content.textContent = 'FPS — · Ping —';
  hud.appendChild(content);
  syncHUDLayout(hud);
}

export function unmountPerformanceHUD() {
  document.getElementById(PERFORMANCE_HUD_ID)?.remove();
}

export function setPerformanceHUDVisible(visible: boolean) {
  const hud = document.getElementById(PERFORMANCE_HUD_ID);
  if (!hud) return;
  syncHUDLayout(hud);

  hud.dataset['open'] = visible ? 'true' : 'false';
  hud.setAttribute('aria-hidden', visible ? 'false' : 'true');
}

export function isPerformanceHUDVisible(): boolean {
  return document.getElementById(PERFORMANCE_HUD_ID)?.dataset['open'] === 'true';
}

export function updatePerformanceHUD(snapshot: PerformanceSnapshot) {
  const hud = document.getElementById(PERFORMANCE_HUD_ID);
  const content = document.getElementById(PERFORMANCE_HUD_CONTENT_ID);
  if (!hud || !content) return;
  syncHUDLayout(hud);

  const fps = Math.round(snapshot.fpsSmoothed);
  content.textContent = `FPS ${fps} · Ping ${formatPing(snapshot)}`;
}
