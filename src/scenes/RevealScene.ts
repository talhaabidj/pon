/**
 * Capsule reveal scene that celebrates the latest pull before returning to the shop.
 */
import {
  AmbientLight,
  CapsuleGeometry,
  Color,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
} from 'three';
import { GAME_CONFIG } from '../core/Config';
import type { CapsulePullResult } from '../systems/CapsuleSystem';
import type { GameContext, GameScene, SceneId, SceneTransitionPayload } from '../core/Scene';
import type { WebGLRenderer } from 'three';

export class RevealScene implements GameScene {
  public readonly id: SceneId = 'reveal';
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(
    GAME_CONFIG.camera.fov,
    1,
    GAME_CONFIG.camera.near,
    GAME_CONFIG.camera.far,
  );
  private readonly capsuleGeometry = new CapsuleGeometry(0.65, 0.9, 8, 32);
  private readonly capsuleMaterial = new MeshStandardMaterial({ color: 0xc9f46c, roughness: 0.3 });
  private readonly capsule = new Mesh(this.capsuleGeometry, this.capsuleMaterial);
  private overlay: HTMLElement | null = null;

  public constructor() {
    this.scene.background = new Color(0x10110f);
    this.camera.position.set(0, 0, 4.2);
    this.scene.add(new AmbientLight(0xf7f7ef, 2), this.capsule);
  }

  public enter(context: GameContext, payload?: SceneTransitionPayload): void {
    const result = payload?.result as CapsulePullResult | undefined;
    if (!result) {
      context.switchScene('shop');
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = `scene-overlay reveal-shell rarity-${result.rarity}`;
    overlay.innerHTML = `
      <section class="reveal-card" data-testid="reveal-card">
        <p class="eyebrow">${result.machineName}</p>
        <h2>${result.item.name}</h2>
        <p class="rarity-label">${result.rarity}${result.isNew ? ' · new' : ' · duplicate'}</p>
        <p>${result.item.flavorText}</p>
        <button type="button" data-testid="reveal-continue">Continue</button>
      </section>
    `;
    overlay
      .querySelector<HTMLButtonElement>('[data-testid="reveal-continue"]')
      ?.addEventListener('click', () => {
        context.switchScene('shop');
      });

    context.uiRoot.append(overlay);
    this.overlay = overlay;
  }

  public exit(): void {
    this.overlay?.remove();
    this.overlay = null;
  }

  public update(deltaSeconds: number): void {
    this.capsule.rotation.y += deltaSeconds * 1.8;
    this.capsule.rotation.z = Math.sin(performance.now() * 0.002) * 0.35;
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
