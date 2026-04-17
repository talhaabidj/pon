/**
 * Owns scene registration and transitions while leaving rendering details inside scenes.
 */
import type { WebGLRenderer } from 'three';
import type { GameContext, GameScene, SceneId, SceneTransitionPayload } from './Scene';

export class SceneManager {
  private readonly scenes = new Map<SceneId, GameScene>();
  private activeScene: GameScene | null = null;

  public constructor(private readonly context: GameContext) {}

  public register(scene: GameScene): void {
    if (this.scenes.has(scene.id)) {
      throw new Error(`Scene already registered: ${scene.id}`);
    }

    this.scenes.set(scene.id, scene);
  }

  public switchTo(sceneId: SceneId, payload?: SceneTransitionPayload): void {
    const nextScene = this.scenes.get(sceneId);
    if (!nextScene) {
      throw new Error(`Cannot switch to unknown scene: ${sceneId}`);
    }

    if (this.activeScene?.id === sceneId) {
      return;
    }

    this.activeScene?.exit();
    this.context.uiRoot.replaceChildren();
    this.activeScene = nextScene;

    const { width, height } = this.context.getSize();
    nextScene.resize(width, height);
    nextScene.enter(this.context, payload);
  }

  public update(deltaSeconds: number): void {
    this.activeScene?.update(deltaSeconds);
  }

  public render(renderer: WebGLRenderer): void {
    this.activeScene?.render(renderer);
  }

  public resize(width: number, height: number): void {
    this.activeScene?.resize(width, height);
  }

  public getActiveSceneId(): SceneId | null {
    return this.activeScene?.id ?? null;
  }

  public dispose(): void {
    this.activeScene?.exit();
    for (const scene of this.scenes.values()) {
      scene.dispose();
    }
    this.scenes.clear();
    this.activeScene = null;
  }
}
