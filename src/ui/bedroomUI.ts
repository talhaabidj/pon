/**
 * bedroomUI — HUD and overlay management for BedroomScene.
 *
 * Handles:
 * - Crosshair
 * - "Press E to ..." interaction prompt
 * - PC profile overlay (live stats from save state)
 * - Collection Shelf Viewer (grid view per set, A/D navigation between sets)
 */

import type { Item, GameState } from '../data/types.js';
import { SETS } from '../data/sets.js';
import { getItemById } from '../data/items.js';

const BEDROOM_UI_ID = 'bedroom-ui';

// Rarity colors for item display
const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  uncommon: '#34d399',
  rare: '#60a5fa',
  epic: '#a78bfa',
  legendary: '#fbbf24',
};

// ————————————————————————————————
// Shelf Viewer State
// ————————————————————————————————
interface SetViewData {
  setName: string;
  items: Array<{ item: Item; owned: boolean }>;
  progress: string;
}

let setViews: SetViewData[] = [];
let currentSetIndex = 0;

export function mountBedroomUI() {
  const uiRoot = document.getElementById('ui-root');
  if (!uiRoot) return;

  const container = document.createElement('div');
  container.id = BEDROOM_UI_ID;
  container.innerHTML = `
    <div class="crosshair" id="bedroom-crosshair"></div>
    <div class="interact-prompt" id="interact-prompt">
      <kbd>E</kbd> <span id="interact-prompt-text">Interact</span>
    </div>
    <div class="bedroom-overlay hidden" id="pc-overlay">
      <div class="overlay-panel">
        <div class="overlay-header">
          <h2>Catchapon Terminal</h2>
          <button class="overlay-close" id="pc-overlay-close">✕</button>
        </div>
        <div class="overlay-body">
          <div class="profile-section">
            <div class="profile-stat">
              <span class="stat-label">Nights Worked</span>
              <span class="stat-value" id="stat-nights">0</span>
            </div>
            <div class="profile-stat">
              <span class="stat-label">Total Money Earned</span>
              <span class="stat-value" id="stat-money">$0</span>
            </div>
            <div class="profile-stat">
              <span class="stat-label">Items Collected</span>
              <span class="stat-value" id="stat-pulls">0 / 25</span>
            </div>
            <div class="profile-stat">
              <span class="stat-label">Sets Completed</span>
              <span class="stat-value" id="stat-sets">0 / 4</span>
            </div>
            <div class="profile-stat">
              <span class="stat-label">Secrets Found</span>
              <span class="stat-value" id="stat-secrets">0</span>
            </div>
          </div>
          <div class="profile-hint">
            <p>Walk to the door to start your night shift.</p>
          </div>
        </div>
      </div>
    </div>
    <div class="shelf-viewer hidden" id="collection-overlay">
      <div class="shelf-case" id="shelf-case">
        <div class="shelf-header">
          <span class="shelf-set-name" id="shelf-set-name"></span>
          <span class="shelf-counter" id="shelf-counter">1 / 4</span>
        </div>
        <div class="shelf-grid" id="shelf-grid"></div>
        <div class="shelf-nav">
          <span class="shelf-nav-btn">◀ <kbd>A</kbd></span>
          <span class="shelf-nav-btn"><kbd>D</kbd> ▶</span>
        </div>
      </div>
      <div class="shelf-close-hint">Press ESC to close</div>
    </div>
  `;
  uiRoot.appendChild(container);

  // Close button handlers
  document.getElementById('pc-overlay-close')?.addEventListener('click', () => {
    hidePCOverlay();
  });
}

export function unmountBedroomUI() {
  document.getElementById(BEDROOM_UI_ID)?.remove();
}

/** Show/hide the interaction prompt */
export function showInteractPrompt(text: string) {
  const prompt = document.getElementById('interact-prompt');
  const promptText = document.getElementById('interact-prompt-text');
  if (prompt && promptText) {
    promptText.textContent = text;
    prompt.classList.add('visible');
  }
  const crosshair = document.getElementById('bedroom-crosshair');
  crosshair?.classList.add('interact');
}

export function hideInteractPrompt() {
  const prompt = document.getElementById('interact-prompt');
  prompt?.classList.remove('visible');
  const crosshair = document.getElementById('bedroom-crosshair');
  crosshair?.classList.remove('interact');
}

/** PC overlay */
export function showPCOverlay() {
  document.getElementById('pc-overlay')?.classList.remove('hidden');
}

export function hidePCOverlay() {
  document.getElementById('pc-overlay')?.classList.add('hidden');
}

export function isPCOverlayVisible(): boolean {
  const overlay = document.getElementById('pc-overlay');
  return overlay ? !overlay.classList.contains('hidden') : false;
}

/** Update PC terminal stats from game state */
export function updatePCStats(state: GameState) {
  const nights = document.getElementById('stat-nights');
  const money = document.getElementById('stat-money');
  const pulls = document.getElementById('stat-pulls');
  const sets = document.getElementById('stat-sets');
  const secrets = document.getElementById('stat-secrets');

  if (nights) nights.textContent = String(state.nightsWorked);
  if (money) money.textContent = `$${state.money}`;
  if (pulls) pulls.textContent = `${state.ownedItemIds.length} / 25`;

  let completedSets = 0;
  for (const set of SETS) {
    const owned = set.itemIds.filter((id) => state.ownedItemIds.includes(id));
    if (owned.length === set.itemIds.length) completedSets++;
  }
  if (sets) sets.textContent = `${completedSets} / ${SETS.length}`;
  if (secrets) secrets.textContent = String(state.secretsTriggered.length);
}

// ————————————————————————————————
// Collection Shelf Viewer (Grid per Set)
// ————————————————————————————————

/** Open the shelf viewer and build the set-based grid data */
export function openCollectionViewer(ownedItemIds: string[]) {
  const ownedSet = new Set(ownedItemIds);

  setViews = SETS.map((set) => {
    const items = set.itemIds.map((itemId) => {
      const item = getItemById(itemId);
      return item ? { item, owned: ownedSet.has(itemId) } : null;
    }).filter((e): e is NonNullable<typeof e> => e != null);

    const ownedCount = items.filter((e) => e.owned).length;
    return {
      setName: set.name,
      items,
      progress: `${ownedCount} / ${items.length}`,
    };
  });

  currentSetIndex = 0;
  renderSetGrid();
  showCollectionOverlay();
}

/** Navigate between sets (-1 = prev, +1 = next) */
export function navigateCollection(direction: -1 | 1) {
  if (setViews.length === 0) return;
  currentSetIndex = (currentSetIndex + direction + setViews.length) % setViews.length;
  renderSetGrid(direction);
}

function renderSetGrid(direction?: -1 | 1) {
  const sv = setViews[currentSetIndex];
  if (!sv) return;

  const gridEl = document.getElementById('shelf-grid');
  const nameEl = document.getElementById('shelf-set-name');
  const counterEl = document.getElementById('shelf-counter');
  const caseEl = document.getElementById('shelf-case');

  if (!gridEl || !nameEl || !counterEl || !caseEl) return;

  nameEl.textContent = sv.setName;
  counterEl.textContent = `${currentSetIndex + 1} / ${setViews.length}`;

  // Build grid HTML
  let html = '';
  for (const entry of sv.items) {
    const color = RARITY_COLORS[entry.item.rarity] ?? '#aaa';

    if (entry.owned) {
      html += `
        <div class="shelf-grid-item" title="${entry.item.flavorText}">
          <div class="shelf-grid-capsule" style="background: ${color}; box-shadow: 0 0 20px ${color}44;"></div>
          <div class="shelf-grid-name" style="color: ${color};">${entry.item.name}</div>
          <div class="shelf-grid-rarity">${entry.item.rarity}</div>
        </div>
      `;
    } else {
      html += `
        <div class="shelf-grid-item locked">
          <div class="shelf-grid-capsule locked"></div>
          <div class="shelf-grid-name">???</div>
          <div class="shelf-grid-rarity">unknown</div>
        </div>
      `;
    }
  }

  gridEl.innerHTML = html;

  // Slide animation
  if (direction !== undefined) {
    caseEl.classList.remove('shelf-slide-left', 'shelf-slide-right');
    void caseEl.offsetWidth;
    caseEl.classList.add(direction === 1 ? 'shelf-slide-left' : 'shelf-slide-right');
  }
}

/** Show/hide collection overlay */
export function showCollectionOverlay() {
  document.getElementById('collection-overlay')?.classList.remove('hidden');
}

export function hideCollectionOverlay() {
  document.getElementById('collection-overlay')?.classList.add('hidden');
}

export function isCollectionOverlayVisible(): boolean {
  const overlay = document.getElementById('collection-overlay');
  return overlay ? !overlay.classList.contains('hidden') : false;
}

// Legacy compat
export function updateCollectionOverlay(ownedItemIds: string[]) {
  openCollectionViewer(ownedItemIds);
}

/** Check if any overlay is currently open */
export function isAnyOverlayOpen(): boolean {
  return isPCOverlayVisible() || isCollectionOverlayVisible();
}
