/**
 * Stub bedroom hub for Milestone 1. Later milestones replace this with traversal and interactions.
 */
import {
  AmbientLight,
  BoxGeometry,
  Color,
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
  private readonly furnitureGeometry = new BoxGeometry(1, 1, 1);
  private readonly floorMaterial = new MeshStandardMaterial({ color: 0x252820, roughness: 0.9 });
  private readonly bedMaterial = new MeshStandardMaterial({ color: 0xff6f91, roughness: 0.75 });
  private readonly deskMaterial = new MeshStandardMaterial({ color: 0x4bd9be, roughness: 0.7 });
  private readonly shelfMaterial = new MeshStandardMaterial({ color: 0xc9f46c, roughness: 0.8 });
  private overlay: HTMLElement | null = null;

  public constructor() {
    this.scene.background = new Color(0x141612);
    this.camera.position.set(0, 2.2, 5.8);
    this.camera.lookAt(0, 0.8, 0);

    const floor = new Mesh(this.floorGeometry, this.floorMaterial);
    floor.rotation.x = -Math.PI / 2;

    const bed = new Mesh(this.furnitureGeometry, this.bedMaterial);
    bed.scale.set(2.2, 0.45, 1.25);
    bed.position.set(-2.1, 0.25, -0.8);

    const desk = new Mesh(this.furnitureGeometry, this.deskMaterial);
    desk.scale.set(1.8, 0.75, 0.8);
    desk.position.set(1.85, 0.45, -1.25);

    const shelf = new Mesh(this.furnitureGeometry, this.shelfMaterial);
    shelf.scale.set(0.35, 2.2, 1.8);
    shelf.position.set(-3.1, 1.1, 1.1);

    const ambient = new AmbientLight(0xf7f7ef, 1.1);
    const lamp = new DirectionalLight(0xfff2c0, 2.3);
    lamp.position.set(1.5, 3, 2.4);

    this.scene.add(floor, bed, desk, shelf, ambient, lamp);
  }

  public enter(context: GameContext): void {
    const overlay = document.createElement('div');
    overlay.className = 'scene-overlay';
    overlay.innerHTML = `
      <aside class="bedroom-hud">
        <h2 data-testid="bedroom-title">Bedroom Hub Stub</h2>
        <p>
          The first room is awake. Next milestone adds PC tabs, collection wall,
          and the door to the night shop.
        </p>
      </aside>
    `;
    context.uiRoot.append(overlay);
    this.overlay = overlay;
  }

  public exit(): void {
    this.overlay?.remove();
    this.overlay = null;
  }

  public update(deltaSeconds: number): void {
    this.camera.position.x = Math.sin(performance.now() * 0.0003) * deltaSeconds * 4;
    this.camera.lookAt(0, 0.8, 0);
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
    this.furnitureGeometry.dispose();
    this.floorMaterial.dispose();
    this.bedMaterial.dispose();
    this.deskMaterial.dispose();
    this.shelfMaterial.dispose();
  }
}
