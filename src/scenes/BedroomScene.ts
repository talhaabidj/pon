/**
 * Bedroom hub scene with PC, collection wall, and door transition into the shop.
 */
import {
  AmbientLight,
  BoxGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
} from 'three';
import { GAME_CONFIG } from '../core/Config';
import type { GameContext, GameScene, SceneId } from '../core/Scene';
import type { WebGLRenderer } from 'three';

export class BedroomScene implements GameScene {
  public readonly id: SceneId = 'bedroom';
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(
    GAME_CONFIG.camera.fov,
    1,
    GAME_CONFIG.camera.near,
    GAME_CONFIG.camera.far,
  );
  private readonly floorGeometry = new PlaneGeometry(8, 6);
  private readonly boxGeometry = new BoxGeometry(1, 1, 1);
  private readonly capsuleGeometry = new CylinderGeometry(0.12, 0.12, 0.32, 18);
  private readonly floorMaterial = new MeshStandardMaterial({ color: 0x252820, roughness: 0.9 });
  private readonly bedMaterial = new MeshStandardMaterial({ color: 0xff6f91, roughness: 0.75 });
  private readonly deskMaterial = new MeshStandardMaterial({ color: 0x4bd9be, roughness: 0.7 });
  private readonly shelfMaterial = new MeshStandardMaterial({ color: 0xc9f46c, roughness: 0.8 });
  private readonly wallMaterial = new MeshStandardMaterial({ color: 0x1d201a, roughness: 1 });
  private overlay: HTMLElement | null = null;
  private context: GameContext | null = null;

  public constructor() {
    this.scene.background = new Color(0x141612);
    this.camera.position.set(0, 2.15, 5.8);
    this.camera.lookAt(0, 0.85, 0);
    this.buildRoom();
  }

  public enter(context: GameContext): void {
    this.context = context;
    this.renderOverlay();
  }

  public exit(): void {
    this.overlay?.remove();
    this.overlay = null;
  }

  public update(deltaSeconds: number): void {
    this.camera.position.x = Math.sin(performance.now() * 0.00028) * deltaSeconds * 3;
    this.camera.lookAt(0, 0.85, 0);
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
    this.floorGeometry.dispose();
    this.boxGeometry.dispose();
    this.capsuleGeometry.dispose();
    this.floorMaterial.dispose();
    this.bedMaterial.dispose();
    this.deskMaterial.dispose();
    this.shelfMaterial.dispose();
    this.wallMaterial.dispose();
  }

  private buildRoom(): void {
    const floor = new Mesh(this.floorGeometry, this.floorMaterial);
    floor.rotation.x = -Math.PI / 2;

    const backWall = new Mesh(this.boxGeometry, this.wallMaterial);
    backWall.scale.set(8, 3, 0.12);
    backWall.position.set(0, 1.5, -3);

    const bed = new Mesh(this.boxGeometry, this.bedMaterial);
    bed.scale.set(2.2, 0.45, 1.25);
    bed.position.set(-2.1, 0.25, -0.8);

    const desk = new Mesh(this.boxGeometry, this.deskMaterial);
    desk.scale.set(1.8, 0.75, 0.8);
    desk.position.set(1.85, 0.45, -1.25);

    const monitor = new Mesh(this.boxGeometry, new MeshStandardMaterial({ color: 0x10110f }));
    monitor.scale.set(0.75, 0.48, 0.08);
    monitor.position.set(1.85, 1.05, -1.72);

    const shelf = new Mesh(this.boxGeometry, this.shelfMaterial);
    shelf.scale.set(0.35, 2.2, 1.8);
    shelf.position.set(-3.1, 1.1, 1.1);

    for (let index = 0; index < 10; index += 1) {
      const capsule = new Mesh(
        this.capsuleGeometry,
        new MeshStandardMaterial({ color: index % 2 === 0 ? 0x4bd9be : 0xff6f91 }),
      );
      capsule.rotation.z = Math.PI / 2;
      capsule.position.set(-2.95, 0.35 + (index % 5) * 0.35, 0.45 + Math.floor(index / 5) * 0.75);
      this.scene.add(capsule);
    }

    const door = new Mesh(this.boxGeometry, new MeshStandardMaterial({ color: 0x2f342a }));
    door.scale.set(0.95, 2.2, 0.1);
    door.position.set(3.25, 1.1, -2.9);

    const ambient = new AmbientLight(0xf7f7ef, 1.05);
    const lamp = new DirectionalLight(0xfff2c0, 2.3);
    lamp.position.set(1.5, 3, 2.4);

    this.scene.add(floor, backWall, bed, desk, monitor, shelf, door, ambient, lamp);
  }

  private renderOverlay(): void {
    if (!this.context) {
      return;
    }

    const snapshot = this.context.session.getSnapshot();
    const setProgress = this.context.session.collectionSystem.getAllSetProgress();
    const shelfItems = this.context.session.collectionSystem.getOwnedItems().slice(0, 8);
    const overlay = document.createElement('div');
    overlay.className = 'scene-overlay bedroom-shell';
    overlay.innerHTML = `
      <aside class="bedroom-hud">
        <p class="eyebrow">Bedroom hub</p>
        <h2 data-testid="bedroom-title">Night ${snapshot.night} waits outside</h2>
        <p>Capsules line the shelf. The PC hums softly. The shop door is quiet for now.</p>
        <div class="hub-stats">
          <span>${snapshot.collectedCount}/${snapshot.totalItems} prizes</span>
          <span>${snapshot.completedSets}/${snapshot.totalSets} sets</span>
          <span>${snapshot.money} yen</span>
          <span>${snapshot.tokens} tokens</span>
        </div>
        <div class="hub-actions">
          <button type="button" data-testid="bedroom-pc">Use PC</button>
          <button type="button" data-testid="bedroom-album">Collection Wall</button>
          <button type="button" class="primary" data-testid="bedroom-door">Start Night Shift</button>
        </div>
      </aside>
      <aside class="collection-peek">
        <p class="eyebrow">Shelf</p>
        <div class="shelf-strip">
          ${
            shelfItems.length > 0
              ? shelfItems.map((item) => `<span title="${item.name}">${item.name}</span>`).join('')
              : '<span>No capsules opened yet</span>'
          }
        </div>
        <p>${setProgress.map((progress) => `${progress.set.name} ${progress.collected}/${progress.total}`).join(' · ')}</p>
      </aside>
    `;

    overlay
      .querySelector<HTMLButtonElement>('[data-testid="bedroom-pc"]')
      ?.addEventListener('click', () => {
        this.showPcOverlay();
      });
    overlay
      .querySelector<HTMLButtonElement>('[data-testid="bedroom-album"]')
      ?.addEventListener('click', () => {
        this.context?.switchScene('album', { returnScene: 'bedroom' });
      });
    overlay
      .querySelector<HTMLButtonElement>('[data-testid="bedroom-door"]')
      ?.addEventListener('click', () => {
        this.context?.session.beginNight();
        this.context?.switchScene('shop');
      });

    this.context.uiRoot.append(overlay);
    this.overlay = overlay;
  }

  private showPcOverlay(): void {
    if (!this.context || !this.overlay) {
      return;
    }

    const snapshot = this.context.session.getSnapshot();
    const modal = document.createElement('section');
    modal.className = 'modal-surface pc-modal';
    modal.dataset.testid = 'pc-modal';
    modal.innerHTML = `
      <header>
        <p class="eyebrow">PonOS staff terminal</p>
        <button type="button" data-testid="pc-close">Close</button>
      </header>
      <div class="pc-tabs">
        <article>
          <h3>Profile</h3>
          <p>Days worked: ${snapshot.night - 1}</p>
          <p>Lifetime wages: ${snapshot.lifetimeMoney} yen</p>
          <p>Tokens used: ${snapshot.lifetimeTokensUsed}</p>
          <p>Sets completed: ${snapshot.completedSets}</p>
        </article>
        <article>
          <h3>Collection</h3>
          <p>${snapshot.collectedCount}/${snapshot.totalItems} prizes logged.</p>
          <button type="button" data-testid="pc-album">Open Album</button>
        </article>
        <article>
          <h3>Shift Log</h3>
          ${
            snapshot.save.shiftLog.length > 0
              ? snapshot.save.shiftLog.map((entry) => `<p>${entry}</p>`).join('')
              : '<p>No strange entries yet.</p>'
          }
        </article>
        <article>
          <h3>Settings</h3>
          <label>Volume <input data-testid="volume-slider" type="range" min="0" max="1" step="0.05" value="${snapshot.save.settings.masterVolume}" /></label>
          <label>Sensitivity <input data-testid="sensitivity-slider" type="range" min="0.5" max="2" step="0.1" value="${snapshot.save.settings.mouseSensitivity}" /></label>
        </article>
      </div>
    `;

    modal
      .querySelector<HTMLButtonElement>('[data-testid="pc-close"]')
      ?.addEventListener('click', () => {
        modal.remove();
      });
    modal
      .querySelector<HTMLButtonElement>('[data-testid="pc-album"]')
      ?.addEventListener('click', () => {
        this.context?.switchScene('album', { returnScene: 'bedroom' });
      });
    modal
      .querySelector<HTMLInputElement>('[data-testid="volume-slider"]')
      ?.addEventListener('input', (event) => {
        const target = event.currentTarget as HTMLInputElement;
        this.context?.session.updateSettings({ masterVolume: Number(target.value) });
      });
    modal
      .querySelector<HTMLInputElement>('[data-testid="sensitivity-slider"]')
      ?.addEventListener('input', (event) => {
        const target = event.currentTarget as HTMLInputElement;
        this.context?.session.updateSettings({ mouseSensitivity: Number(target.value) });
      });

    this.overlay.append(modal);
  }
}
