/**
 * Scene contract shared by the renderer loop, game shell, and scene modules.
 */
import type { WebGLRenderer } from 'three';
import type { GameSession } from './GameSession';
import type { Input } from './Input';

export type SceneId = 'boot' | 'desktop' | 'bedroom' | 'shop' | 'reveal' | 'album' | 'end';

export type SceneTransitionPayload = Readonly<Record<string, unknown>>;

export interface GameContext {
  readonly gameRoot: HTMLElement;
  readonly uiRoot: HTMLElement;
  readonly input: Input;
  readonly session: GameSession;
  readonly switchScene: (sceneId: SceneId, payload?: SceneTransitionPayload) => void;
  readonly getSize: () => { width: number; height: number };
}

export interface GameScene {
  readonly id: SceneId;
  enter(context: GameContext, payload?: SceneTransitionPayload): void;
  exit(): void;
  update(deltaSeconds: number): void;
  resize(width: number, height: number): void;
  render(renderer: WebGLRenderer): void;
  dispose(): void;
}
