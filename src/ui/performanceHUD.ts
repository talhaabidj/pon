import type { PerformanceSnapshot } from '../core/PerformanceMetrics.js';

const PERFORMANCE_HUD_ID = 'performance-hud';
const PERFORMANCE_HUD_CONTENT_ID = 'performance-hud-content';

type PerformanceChipLevel = 'good' | 'warn' | 'bad' | 'neutral';

interface PerformanceChip {
  label: string;
  value: string;
  level: PerformanceChipLevel;
}

function resolveHUDHost(): HTMLElement {
  return document.getElementById('ui-root') ?? document.body;
}

function syncHUDLayout(hud: HTMLElement) {
  if (hud.parentElement !== resolveHUDHost()) {
    resolveHUDHost().appendChild(hud);
  }
  hud.dataset['layout'] = document.getElementById('shop-hud') ? 'shop' : 'default';
}

function getFpsLevel(value: number): PerformanceChipLevel {
  if (value >= 55) return 'good';
  if (value >= 42) return 'warn';
  return 'bad';
}

function getFrameLevel(valueMs: number): PerformanceChipLevel {
  if (valueMs <= 18) return 'good';
  if (valueMs <= 24) return 'warn';
  return 'bad';
}

function getPingLevel(valueMs: number | null): PerformanceChipLevel {
  if (valueMs == null) return 'neutral';
  if (valueMs <= 70) return 'good';
  if (valueMs <= 140) return 'warn';
  return 'bad';
}

function formatPing(snapshot: PerformanceSnapshot): string {
  if (snapshot.pingMs == null) return 'n/a';
  const pingCore = `${Math.round(snapshot.pingMs)} ms`;
  if (snapshot.pingJitterMs == null) return pingCore;
  return `${pingCore} ±${Math.round(snapshot.pingJitterMs)}`;
}

function formatNetwork(snapshot: PerformanceSnapshot): string {
  const label = snapshot.networkType?.toUpperCase() ?? 'Unknown';
  if (snapshot.downlinkMbps == null) return label;
  return `${label} ${snapshot.downlinkMbps.toFixed(1)} Mbps`;
}

function buildUserFacingChips(snapshot: PerformanceSnapshot): PerformanceChip[] {
  const chips: PerformanceChip[] = [
    {
      label: 'FPS',
      value: `${Math.round(snapshot.fpsSmoothed)}`,
      level: getFpsLevel(snapshot.fpsSmoothed),
    },
    {
      label: '1% Low',
      value: `${Math.round(snapshot.fpsLow1)}`,
      level: getFpsLevel(snapshot.fpsLow1),
    },
    {
      label: 'Frame',
      value: `${snapshot.frameTimeAvgMs.toFixed(1)} ms`,
      level: getFrameLevel(snapshot.frameTimeAvgMs),
    },
    {
      label: 'Ping',
      value: formatPing(snapshot),
      level: getPingLevel(snapshot.pingMs),
    },
  ];

  if (snapshot.networkType != null || snapshot.downlinkMbps != null) {
    chips.push({
      label: 'Network',
      value: formatNetwork(snapshot),
      level: 'neutral',
    });
  }

  if (snapshot.paused) {
    chips.push({
      label: 'State',
      value: 'Paused',
      level: 'warn',
    });
  }

  return chips;
}

function renderChip(content: HTMLElement, chip: PerformanceChip) {
  const chipEl = document.createElement('span');
  chipEl.className = 'performance-chip';
  chipEl.dataset['level'] = chip.level;

  const label = document.createElement('span');
  label.className = 'performance-chip-label';
  label.textContent = chip.label;
  chipEl.appendChild(label);

  const value = document.createElement('span');
  value.className = 'performance-chip-value';
  value.textContent = chip.value;
  chipEl.appendChild(value);

  content.appendChild(chipEl);
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
  hud.appendChild(content);
  syncHUDLayout(hud);

  const label = document.createElement('span');
  label.className = 'performance-label';
  label.textContent = 'Performance (F3)';
  content.appendChild(label);
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

  content.replaceChildren();

  const title = document.createElement('span');
  title.className = 'performance-label';
  title.textContent = 'Performance (F3)';
  content.appendChild(title);

  const chips = buildUserFacingChips(snapshot);
  for (const chip of chips) {
    renderChip(content, chip);
  }
}
