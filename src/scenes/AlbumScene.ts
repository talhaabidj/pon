/**
 * Collection album browser for bedroom and shop routes.
 */
import { Color, PerspectiveCamera, Scene } from 'three';
import { ITEMS } from '../data/items';
import { GAME_CONFIG } from '../core/Config';
import type { GameContext, GameScene, SceneId, SceneTransitionPayload } from '../core/Scene';
import type { WebGLRenderer } from 'three';

export class AlbumScene implements GameScene {
  public readonly id: SceneId = 'album';
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(
    GAME_CONFIG.camera.fov,
    1,
    GAME_CONFIG.camera.near,
    GAME_CONFIG.camera.far,
  );
  private overlay: HTMLElement | null = null;

  public constructor() {
    this.scene.background = new Color(0x10110f);
    this.camera.position.set(0, 0, 2);
  }

  public enter(context: GameContext, payload?: SceneTransitionPayload): void {
    const returnScene = (payload?.returnScene as SceneId | undefined) ?? 'bedroom';
    const progress = context.session.collectionSystem.getAllSetProgress();
    const owned = new Set(context.session.collectionSystem.getCollectedItemIds());
    const overlay = document.createElement('div');
    overlay.className = 'scene-overlay album-shell';
    overlay.innerHTML = `
      <main class="album-surface" data-testid="album-surface">
        <header>
          <div>
            <p class="eyebrow">Collection album</p>
            <h2>Capsule Index</h2>
          </div>
          <button type="button" data-testid="album-back">Back</button>
        </header>
        <section class="set-progress-row">
          ${progress
            .map(
              (set) => `
                <span>${set.set.name} ${set.collected}/${set.total}</span>
              `,
            )
            .join('')}
        </section>
        <section class="album-grid">
          ${ITEMS.map(
            (item) => `
              <article class="${owned.has(item.id) ? 'owned' : 'missing'}">
                <p>${owned.has(item.id) ? item.name : '???'}</p>
                <small>${item.rarity} · ${item.setId}</small>
              </article>
            `,
          ).join('')}
        </section>
      </main>
    `;
    overlay
      .querySelector<HTMLButtonElement>('[data-testid="album-back"]')
      ?.addEventListener('click', () => {
        context.switchScene(returnScene);
      });
    context.uiRoot.append(overlay);
    this.overlay = overlay;
  }

  public exit(): void {
    this.overlay?.remove();
    this.overlay = null;
  }

  public update(): void {
    // Album is DOM-only for now.
  }

  public resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  public render(renderer: WebGLRenderer): void {
    renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.exit();
  }
}
