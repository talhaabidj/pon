/**
 * Game — Main application class.
 *
 * Creates the Three.js renderer, manages the render loop,
 * handles window resizing, and delegates to SceneManager.
 */

import * as THREE from 'three';
import { SceneManager } from './SceneManager.js';
import { Input } from './Input.js';
import { RENDERER_PIXEL_RATIO_MAX } from './Config.js';

export class Game {
  readonly renderer: THREE.WebGLRenderer;
  readonly sceneManager: SceneManager;
  readonly input: Input;

  private clock = new THREE.Clock();
  private animationFrameId = 0;

  constructor(container: HTMLElement) {
    // —— Renderer ——
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, RENDERER_PIXEL_RATIO_MAX),
    );
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    container.appendChild(this.renderer.domElement);

    // —— Systems ——
    this.sceneManager = new SceneManager();
    this.input = new Input();

    // —— Resize ——
    window.addEventListener('resize', this.onResize);
  }

  /** Start the render loop */
  start() {
    this.clock.start();
    this.loop();
  }

  /** Stop the render loop and clean up */
  stop() {
    cancelAnimationFrame(this.animationFrameId);
    this.sceneManager.dispose();
    this.input.dispose();
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }

  /** The main render loop */
  private loop = () => {
    this.animationFrameId = requestAnimationFrame(this.loop);

    const dt = Math.min(this.clock.getDelta(), 1 / 30); // cap dt to avoid spiral of death
    this.sceneManager.update(dt);
    this.input.endFrame();
  };

  private onResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height);

    // Scenes are responsible for updating their own cameras on resize
    // via listening to a 'resize' event or checking in update()
  };

  /** Get the renderer's DOM element (for pointer lock etc.) */
  get canvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }
}
