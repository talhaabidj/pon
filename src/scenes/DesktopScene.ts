/**
 * Fake OS entry scene. The Start Shift button launches the first playable hub stub.
 */
import {
  AmbientLight,
  CapsuleGeometry,
  Color,
  DirectionalLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
} from 'three';
import { GAME_CONFIG } from '../core/Config';
import type { GameContext, GameScene, SceneId } from '../core/Scene';
import type { WebGLRenderer } from 'three';

export class DesktopScene implements GameScene {
  public readonly id: SceneId = 'desktop';
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(
    GAME_CONFIG.camera.fov,
    1,
    GAME_CONFIG.camera.near,
    GAME_CONFIG.camera.far,
  );
  private readonly capsuleGroup = new Group();
  private readonly capsuleGeometry = new CapsuleGeometry(0.42, 0.7, 8, 24);
  private readonly capsuleMaterial = new MeshStandardMaterial({
    color: new Color(0x4bd9be),
    roughness: 0.42,
    metalness: 0.08,
  });
  private overlay: HTMLElement | null = null;
  private launchTimeout = 0;

  public constructor() {
    this.scene.background = new Color(0x10110f);
    this.camera.position.set(0, 0.3, 4);

    const ambient = new AmbientLight(0xf7f7ef, 1.35);
    const key = new DirectionalLight(0xc9f46c, 1.65);
    key.position.set(2.5, 3, 4);

    const capsule = new Mesh(this.capsuleGeometry, this.capsuleMaterial);
    capsule.rotation.z = Math.PI / 2;
    this.capsuleGroup.add(capsule);
    this.scene.add(ambient, key, this.capsuleGroup);
  }

  public enter(context: GameContext): void {
    const overlay = document.createElement('div');
    overlay.className = 'scene-overlay desktop-shell';
    overlay.innerHTML = `
      <main class="desktop-window" aria-labelledby="desktop-title">
        <header class="desktop-titlebar">
          <h1 id="desktop-title" data-testid="desktop-title">PON Night Shift</h1>
          <span class="desktop-status">22:00 standby</span>
        </header>
        <section class="desktop-body">
          <p class="desktop-copy">
            The shop keys are waiting. Keep the machines gentle, keep the floor quiet.
          </p>
          <div class="desktop-actions">
            <button class="desktop-button primary" type="button" data-testid="start-shift">
              Start Shift
            </button>
            <button class="desktop-button" type="button" disabled>Profile</button>
            <button class="desktop-button" type="button" disabled>Collection</button>
            <button class="desktop-button" type="button" disabled>Settings</button>
            <button class="desktop-button" type="button" disabled>Quit</button>
          </div>
        </section>
      </main>
    `;

    const startButton = overlay.querySelector<HTMLButtonElement>('[data-testid="start-shift"]');
    if (!startButton) {
      throw new Error('DesktopScene could not create the Start Shift button.');
    }

    startButton.addEventListener('click', () => {
      startButton.disabled = true;
      overlay.classList.add('is-booting');
      this.launchTimeout = window.setTimeout(() => {
        context.switchScene('bedroom', { source: 'desktop' });
      }, GAME_CONFIG.desktopLaunchDelayMs);
    });

    context.uiRoot.append(overlay);
    this.overlay = overlay;
  }

  public exit(): void {
    window.clearTimeout(this.launchTimeout);
    this.overlay?.remove();
    this.overlay = null;
  }

  public update(deltaSeconds: number): void {
    this.capsuleGroup.rotation.y += deltaSeconds * 0.55;
    this.capsuleGroup.rotation.x = Math.sin(performance.now() * 0.001) * 0.08;
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
    this.capsuleGeometry.dispose();
    this.capsuleMaterial.dispose();
  }
}
