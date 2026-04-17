/**
 * Initial boot scene that warms the renderer and hands off to the fake desktop.
 */
import {
  AmbientLight,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  RingGeometry,
  Scene,
} from 'three';
import { GAME_CONFIG } from '../core/Config';
import type { GameContext, GameScene, SceneId } from '../core/Scene';
import type { WebGLRenderer } from 'three';

export class BootScene implements GameScene {
  public readonly id: SceneId = 'boot';
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(
    GAME_CONFIG.camera.fov,
    1,
    GAME_CONFIG.camera.near,
    GAME_CONFIG.camera.far,
  );
  private readonly ringGeometry = new RingGeometry(0.85, 1, 48);
  private readonly ringMaterial = new MeshBasicMaterial({ color: 0xc9f46c });
  private readonly ring = new Mesh(this.ringGeometry, this.ringMaterial);
  private context: GameContext | null = null;
  private overlay: HTMLElement | null = null;
  private elapsedSeconds = 0;

  public constructor() {
    this.camera.position.set(0, 0, 4);
    this.scene.add(new AmbientLight(0xffffff, 1));
    this.scene.add(this.ring);
  }

  public enter(context: GameContext): void {
    this.context = context;
    this.elapsedSeconds = 0;

    const overlay = document.createElement('div');
    overlay.className = 'scene-overlay boot-overlay';
    overlay.innerHTML = `
      <div class="boot-mark">
        <div class="boot-logo">PON</div>
        <div>Night shift shell loading</div>
      </div>
    `;
    context.uiRoot.append(overlay);
    this.overlay = overlay;
  }

  public exit(): void {
    this.overlay?.remove();
    this.overlay = null;
  }

  public update(deltaSeconds: number): void {
    this.elapsedSeconds += deltaSeconds;
    this.ring.rotation.z += deltaSeconds * 1.8;

    if (this.elapsedSeconds >= GAME_CONFIG.bootSceneDurationSeconds) {
      this.context?.switchScene('desktop');
    }
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
    this.ringGeometry.dispose();
    this.ringMaterial.dispose();
  }
}
