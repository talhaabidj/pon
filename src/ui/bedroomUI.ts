/**
 * bedroomUI — HUD and overlay management for BedroomScene.
 *
 * Handles:
 * - Crosshair
 * - "Press E to ..." interaction prompt
 * - PC profile overlay (stub)
 * - Collection wall overlay (stub)
 */

const BEDROOM_UI_ID = 'bedroom-ui';

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
          <h2>PON Terminal</h2>
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
              <span class="stat-label">Gachas Pulled</span>
              <span class="stat-value" id="stat-pulls">0</span>
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
    <div class="bedroom-overlay hidden" id="collection-overlay">
      <div class="overlay-panel">
        <div class="overlay-header">
          <h2>Collection</h2>
          <button class="overlay-close" id="collection-overlay-close">✕</button>
        </div>
        <div class="overlay-body">
          <p class="collection-empty">Your collection is empty. Start pulling capsules!</p>
        </div>
      </div>
    </div>
  `;
  uiRoot.appendChild(container);

  // Close button handlers
  document.getElementById('pc-overlay-close')?.addEventListener('click', () => {
    hidePCOverlay();
  });
  document.getElementById('collection-overlay-close')?.addEventListener('click', () => {
    hideCollectionOverlay();
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
  // Expand crosshair
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
  const overlay = document.getElementById('pc-overlay');
  overlay?.classList.remove('hidden');
}

export function hidePCOverlay() {
  const overlay = document.getElementById('pc-overlay');
  overlay?.classList.add('hidden');
}

export function isPCOverlayVisible(): boolean {
  const overlay = document.getElementById('pc-overlay');
  return overlay ? !overlay.classList.contains('hidden') : false;
}

/** Collection overlay */
export function showCollectionOverlay() {
  const overlay = document.getElementById('collection-overlay');
  overlay?.classList.remove('hidden');
}

export function hideCollectionOverlay() {
  const overlay = document.getElementById('collection-overlay');
  overlay?.classList.add('hidden');
}

export function isCollectionOverlayVisible(): boolean {
  const overlay = document.getElementById('collection-overlay');
  return overlay ? !overlay.classList.contains('hidden') : false;
}

/** Check if any overlay is currently open */
export function isAnyOverlayOpen(): boolean {
  return isPCOverlayVisible() || isCollectionOverlayVisible();
}
