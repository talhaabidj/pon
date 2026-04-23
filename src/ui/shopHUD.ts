/**
 * shopHUD — Shop scene HUD overlay.
 *
 * Displays: in-game clock, money, tokens, task list, pull result.
 */

import { TOKEN_PACK_OPTIONS, TOKEN_PRICE } from '../core/Config.js';
import { formatCurrency } from '../core/Currency.js';

const SHOP_HUD_ID = 'shop-hud';
let pullDismissHandler: ((e: KeyboardEvent) => void) | null = null;
let lastPromptSignature = '';
let promptVisible = false;

export interface ShopPromptAction {
  key: string;
  label: string;
}

export interface ShopPromptPayload {
  text: string;
  actions?: readonly ShopPromptAction[];
}

export function mountShopHUD() {
  const uiRoot = document.getElementById('ui-root');
  if (!uiRoot) return;

  const zeroCurrency = formatCurrency(0);
  const tokenPriceLabel = formatCurrency(TOKEN_PRICE);
  const tokenPackButtons = TOKEN_PACK_OPTIONS.map((count) => (
    `<button class="token-buy-btn" data-count="${count}">Buy ${count} (${formatCurrency(count * TOKEN_PRICE)})</button>`
  )).join('');

  const container = document.createElement('div');
  container.id = SHOP_HUD_ID;
  container.innerHTML = `
    <div class="crosshair" id="shop-crosshair"></div>

    <div class="shop-top-bar">
      <div class="shop-clock" id="shop-clock">10:00 PM</div>
      <div class="shop-time-bar">
        <div class="shop-time-fill" id="shop-time-fill"></div>
      </div>
      <div class="shop-stats">
        <span class="shop-stat" id="shop-money">${zeroCurrency}</span>
        <span class="shop-stat-divider">|</span>
        <span class="shop-stat" id="shop-tokens">🪙 0</span>
      </div>
    </div>

    <div class="shop-task-panel" id="shop-tasks">
      <div class="task-panel-header">Tasks</div>
      <div class="task-list" id="task-list"></div>
    </div>

    <div class="interact-prompt" id="shop-interact-prompt">
      <div class="shop-prompt-actions" id="shop-prompt-actions"></div>
      <span class="shop-prompt-detail" id="shop-interact-text">Interact</span>
    </div>

    <div class="shop-pull-result hidden" id="pull-result">
      <div class="pull-capsule" id="pull-capsule"></div>
      <div class="pull-item-name" id="pull-item-name"></div>
      <div class="pull-item-rarity" id="pull-item-rarity"></div>
      <div class="pull-item-flavor" id="pull-item-flavor"></div>
      <div class="pull-dismiss" id="pull-dismiss-text">Press Q to continue</div>
    </div>

    <div class="shop-token-overlay hidden" id="token-overlay">
      <div class="overlay-panel">
        <div class="overlay-header">
          <h2>Buy Tokens</h2>
          <button class="overlay-close" id="token-overlay-close">✕</button>
        </div>
        <div class="overlay-body">
          <div class="token-info">
            <p>Each token costs <strong>${tokenPriceLabel}</strong></p>
            <p>Your balance: <span id="token-balance">${zeroCurrency}</span></p>
          </div>
          <div class="token-buttons">
            ${tokenPackButtons}
          </div>
        </div>
      </div>
    </div>

    <div class="shop-night-end hidden" id="night-end-overlay">
      <div class="overlay-panel night-summary-panel">
        <h2>Night Complete</h2>
        <div class="night-summary" id="night-summary"></div>
        <p class="pull-dismiss">Press Q to return home</p>
        <button class="night-continue-btn" id="night-continue">Return Home</button>
      </div>
    </div>

    <div class="shop-ending-soon hidden" id="ending-soon-banner">
      ⚠️ Shift ending soon!
    </div>

    <div class="toast-container" id="shop-toasts"></div>
  `;
  uiRoot.appendChild(container);
}

export function unmountShopHUD() {
  if (pullDismissHandler) {
    window.removeEventListener('keydown', pullDismissHandler);
    pullDismissHandler = null;
  }
  lastPromptSignature = '';
  promptVisible = false;
  document.getElementById(SHOP_HUD_ID)?.remove();
}

// —— Update functions ——

export function updateClock(timeStr: string) {
  const el = document.getElementById('shop-clock');
  if (el) el.textContent = timeStr;
}

export function updateTimeBar(progress: number) {
  const el = document.getElementById('shop-time-fill') as HTMLElement | null;
  if (el) el.style.width = `${Math.min(100, progress * 100)}%`;
}

export function updateMoney(amount: number) {
  const el = document.getElementById('shop-money');
  if (el) el.textContent = formatCurrency(amount);
}

export function updateTokens(count: number) {
  const el = document.getElementById('shop-tokens');
  if (el) el.textContent = `🪙 ${count}`;
}

export function updateTokenBalance(amount: number) {
  const el = document.getElementById('token-balance');
  if (el) el.textContent = formatCurrency(amount);
}

export function renderTaskList(
  tasks: Array<{ description: string; isCompleted: boolean }>,
) {
  const list = document.getElementById('task-list');
  if (!list) return;

  list.innerHTML = tasks
    .map(
      (t, i) =>
        `<div class="task-item ${t.isCompleted ? 'completed' : ''}" data-idx="${i}">
          <span class="task-check">${t.isCompleted ? '✓' : '○'}</span>
          <span class="task-desc">${t.description}</span>
        </div>`,
    )
    .join('');
}

// —— Interact prompt ——

export function showShopPrompt(prompt: string | ShopPromptPayload, keyLabel = 'E') {
  const el = document.getElementById('shop-interact-prompt');
  const txt = document.getElementById('shop-interact-text');
  const actionsEl = document.getElementById('shop-prompt-actions');

  const payload: ShopPromptPayload = typeof prompt === 'string'
    ? {
      text: prompt,
      actions: keyLabel.trim().length > 0
        ? [{ key: keyLabel, label: 'Interact' }]
        : [],
    }
    : prompt;

  const actions = payload.actions ?? [];
  const signature = `${payload.text}::${actions.map((a) => `${a.key}:${a.label}`).join('|')}`;

  if (el && txt) {
    // Prompt text often repeats every frame while aiming at the same target.
    // Skip DOM rewrites unless content actually changed to reduce INP/jank.
    if (signature !== lastPromptSignature) {
      txt.textContent = payload.text;
      if (actionsEl) {
        actionsEl.innerHTML = '';
        actionsEl.classList.toggle('hidden', actions.length === 0);

        actions.forEach((action) => {
          const actionEl = document.createElement('div');
          actionEl.className = 'shop-prompt-action';
          actionEl.setAttribute('data-key', action.key);

          const keyEl = document.createElement('kbd');
          keyEl.className = 'shop-prompt-key';
          keyEl.textContent = action.key;

          const labelEl = document.createElement('span');
          labelEl.className = 'shop-prompt-label';
          labelEl.textContent = action.label;

          actionEl.appendChild(keyEl);
          actionEl.appendChild(labelEl);
          actionsEl.appendChild(actionEl);
        });
      }
      el.classList.toggle('has-multi-actions', actions.length > 1);
      lastPromptSignature = signature;
    }
    if (!promptVisible) {
      el.classList.add('visible');
      promptVisible = true;
    }
  }
  document.getElementById('shop-crosshair')?.classList.add('interact');
}

export function hideShopPrompt() {
  if (promptVisible) {
    document.getElementById('shop-interact-prompt')?.classList.remove('visible');
    promptVisible = false;
  }
  document.getElementById('shop-crosshair')?.classList.remove('interact');
}

// —— Pull result ——

export function showPullResult(
  name: string,
  rarity: string,
  flavor: string,
  accentColor: string,
  dismissKeyCode = 'KeyQ',
  onDismiss?: () => void
) {
  const el = document.getElementById('pull-result');
  const capsuleEl = document.getElementById('pull-capsule');
  const nameEl = document.getElementById('pull-item-name');
  const rarityEl = document.getElementById('pull-item-rarity');
  const flavorEl = document.getElementById('pull-item-flavor');

  if (el && capsuleEl && nameEl && rarityEl && flavorEl) {
    capsuleEl.style.background = accentColor;
    nameEl.textContent = name;
    rarityEl.textContent = rarity.toUpperCase();
    rarityEl.className = `pull-item-rarity rarity-${rarity}`;
    flavorEl.textContent = `"${flavor}"`;
    el.classList.remove('hidden');

    const dismissText = document.getElementById('pull-dismiss-text');
    if (dismissText) {
      dismissText.textContent = `Press ${dismissKeyCode.replace('Key', '')} to continue`;
    }

    if (onDismiss) {
      const dismissHandler = (e: KeyboardEvent) => {
        if (e.code !== dismissKeyCode) return;
        window.removeEventListener('keydown', dismissHandler);
        pullDismissHandler = null;
        onDismiss();
      };

      if (pullDismissHandler) {
        window.removeEventListener('keydown', pullDismissHandler);
      }

      setTimeout(() => {
        pullDismissHandler = dismissHandler;
        window.addEventListener('keydown', dismissHandler);
      }, 300); // Small delay to prevent accidental instant dismissal
    }
  }
}

export function hidePullResult() {
  if (pullDismissHandler) {
    window.removeEventListener('keydown', pullDismissHandler);
    pullDismissHandler = null;
  }
  document.getElementById('pull-result')?.classList.add('hidden');
}

export function isPullResultVisible(): boolean {
  const el = document.getElementById('pull-result');
  return el ? !el.classList.contains('hidden') : false;
}

// —— Token overlay ——

export function showTokenOverlay() {
  document.getElementById('token-overlay')?.classList.remove('hidden');
}

export function hideTokenOverlay() {
  document.getElementById('token-overlay')?.classList.add('hidden');
}

export function isTokenOverlayVisible(): boolean {
  const el = document.getElementById('token-overlay');
  return el ? !el.classList.contains('hidden') : false;
}

// —— Night end overlay ——

export function showNightEndOverlay(summary: {
  tasksCompleted: number;
  tasksTotal: number;
  moneyEarned: number;
  itemsObtained: Array<{ name: string; rarity: string }>;
}) {
  const el = document.getElementById('night-end-overlay');
  const summaryEl = document.getElementById('night-summary');
  if (el && summaryEl) {
    const rarityColors: Record<string, string> = {
      common: '#9ca3af',
      uncommon: '#34d399',
      rare: '#60a5fa',
      epic: '#a78bfa',
      legendary: '#fbbf24',
    };

    const itemsHtml = summary.itemsObtained.length > 0
      ? summary.itemsObtained
          .map(
            (item) =>
              `<div class="summary-item" style="color: ${rarityColors[item.rarity] ?? '#aaa'};">
                <span class="summary-item-dot" style="background: ${rarityColors[item.rarity] ?? '#aaa'};"></span>
                ${item.name}
              </div>`,
          )
          .join('')
      : '<span style="color: var(--color-text-dim);">No items this shift</span>';

    summaryEl.innerHTML = `
      <div class="summary-stat">
        <span>Tasks Completed</span>
        <span>${summary.tasksCompleted} / ${summary.tasksTotal}</span>
      </div>
      <div class="summary-stat">
        <span>Credits Earned</span>
        <span>${formatCurrency(summary.moneyEarned)}</span>
      </div>
      <div class="summary-stat">
        <span>Items Obtained</span>
        <span>${summary.itemsObtained.length}</span>
      </div>
      <div class="summary-items">${itemsHtml}</div>
    `;
    el.classList.remove('hidden');
  }
}

export function hideNightEndOverlay() {
  document.getElementById('night-end-overlay')?.classList.add('hidden');
}

export function isNightEndVisible(): boolean {
  const el = document.getElementById('night-end-overlay');
  return el ? !el.classList.contains('hidden') : false;
}

// —— Ending soon banner ——

export function showEndingSoon() {
  document.getElementById('ending-soon-banner')?.classList.remove('hidden');
}

export function hideEndingSoon() {
  document.getElementById('ending-soon-banner')?.classList.add('hidden');
}

// —— Any overlay open ——

export function isAnyShopOverlayOpen(): boolean {
  return isPullResultVisible() || isTokenOverlayVisible() || isNightEndVisible();
}

// —— Toast notifications ——

export function showToast(message: string, duration = 3000) {
  const container = document.getElementById('shop-toasts');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
