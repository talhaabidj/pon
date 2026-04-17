/**
 * Bootstraps the Three.js renderer, input layer, scene manager, and animation loop.
 */
import { SRGBColorSpace, WebGLRenderer } from 'three';
import { BedroomScene } from '../scenes/BedroomScene';
import { BootScene } from '../scenes/BootScene';
import { DesktopScene } from '../scenes/DesktopScene';
import { GAME_CONFIG } from './Config';
import { Input } from './Input';
import { SceneManager } from './SceneManager';
import type { GameContext, SceneId, SceneTransitionPayload } from './Scene';

export class Game {
  private readonly renderer: WebGLRenderer;
  private readonly input: Input;
  private readonly sceneManager: SceneManager;
  private animationFrameId = 0;
  private lastFrameTime = 0;

  public constructor(
    private readonly gameRoot: HTMLElement,
    private readonly uiRoot: HTMLElement,
  ) {
    this.renderer = new WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.setClearColor(GAME_CONFIG.clearColor);
    this.renderer.domElement.dataset.testid = 'pon-canvas';
    this.gameRoot.append(this.renderer.domElement);

    this.input = new Input(this.renderer.domElement);

    const context: GameContext = {
      gameRoot: this.gameRoot,
      uiRoot: this.uiRoot,
      input: this.input,
      switchScene: (sceneId: SceneId, payload?: SceneTransitionPayload) => {
        this.sceneManager.switchTo(sceneId, payload);
      },
      getSize: () => this.getSize(),
    };

    this.sceneManager = new SceneManager(context);
    this.sceneManager.register(new BootScene());
    this.sceneManager.register(new DesktopScene());
    this.sceneManager.register(new BedroomScene());

    window.addEventListener('resize', this.handleResize);
    this.handleResize();
  }

  public start(): void {
    this.sceneManager.switchTo('boot');
    this.lastFrameTime = performance.now();
    this.animationFrameId = window.requestAnimationFrame(this.tick);
  }

  public dispose(): void {
    window.cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.handleResize);
    this.sceneManager.dispose();
    this.input.destroy();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private readonly tick = (time: number): void => {
    const rawDelta = (time - this.lastFrameTime) / 1000;
    const deltaSeconds = Math.min(rawDelta, GAME_CONFIG.maxDeltaSeconds);
    this.lastFrameTime = time;

    this.sceneManager.update(deltaSeconds);
    this.sceneManager.render(this.renderer);
    this.animationFrameId = window.requestAnimationFrame(this.tick);
  };

  private readonly handleResize = (): void => {
    const { width, height } = this.getSize();
    const pixelRatio = Math.min(window.devicePixelRatio, GAME_CONFIG.maxPixelRatio);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height, false);
    this.sceneManager.resize(width, height);
  };

  private getSize(): { width: number; height: number } {
    return {
      width: Math.max(1, this.gameRoot.clientWidth || window.innerWidth),
      height: Math.max(1, this.gameRoot.clientHeight || window.innerHeight),
    };
  }
}
