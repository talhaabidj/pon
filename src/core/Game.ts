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
import { PerformanceMetricsTracker } from './PerformanceMetrics.js';
import {
  mountPerformanceHUD,
  setPerformanceHUDVisible,
  unmountPerformanceHUD,
  updatePerformanceHUD,
} from '../ui/performanceHUD.js';

const PERFORMANCE_HUD_STORAGE_KEY = 'catchapon:performance-hud';
const PERFORMANCE_HUD_REFRESH_MS = 500;

export class Game {
  readonly renderer: THREE.WebGLRenderer;
  readonly sceneManager: SceneManager;
  readonly input: Input;

  private clock = new THREE.Clock();
  private animationFrameId = 0;
  private readonly performanceMetrics = new PerformanceMetricsTracker();
  private performanceHUDVisible = false;
  private lastPerformanceHUDPaintAtMs = 0;
  public isPaused = false;

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
    mountPerformanceHUD();
    this.performanceHUDVisible = this.readPerformanceHUDPreference();
    setPerformanceHUDVisible(this.performanceHUDVisible);
    if (this.performanceHUDVisible) {
      updatePerformanceHUD(this.performanceMetrics.getSnapshot());
    }

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
    unmountPerformanceHUD();
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }

  /** The main render loop */
  private loop = () => {
    this.animationFrameId = requestAnimationFrame(this.loop);
    const frameStartMs = performance.now();

    const rawDt = Math.min(this.clock.getDelta(), 1 / 30); // cap dt to avoid spiral of death
    let dt = rawDt;

    if (this.isPaused) {
      dt = 0; // Freeze time for scenes, but still let them render
    }

    this.sceneManager.update(dt);

    if (this.input.isPerformanceTogglePressed()) {
      this.setPerformanceHUDEnabled(!this.performanceHUDVisible);
    }

    if (this.performanceHUDVisible) {
      const activeScene = this.sceneManager.getCurrent();
      const sceneName = activeScene?.constructor?.name ?? null;
      const stepCpuMs = performance.now() - frameStartMs;
      const snapshot = this.performanceMetrics.sample(
        rawDt * 1000,
        stepCpuMs,
        this.renderer,
        this.isPaused,
        sceneName,
        frameStartMs,
      );
      if ((frameStartMs - this.lastPerformanceHUDPaintAtMs) >= PERFORMANCE_HUD_REFRESH_MS) {
        updatePerformanceHUD(snapshot);
        this.lastPerformanceHUDPaintAtMs = frameStartMs;
      }
    }

    this.input.endFrame();
  };

  private readPerformanceHUDPreference(): boolean {
    try {
      return window.localStorage.getItem(PERFORMANCE_HUD_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  private setPerformanceHUDEnabled(enabled: boolean) {
    this.performanceHUDVisible = enabled;
    setPerformanceHUDVisible(enabled);

    if (enabled) {
      this.lastPerformanceHUDPaintAtMs = 0;
      updatePerformanceHUD(this.performanceMetrics.getSnapshot());
    }

    try {
      window.localStorage.setItem(PERFORMANCE_HUD_STORAGE_KEY, enabled ? '1' : '0');
    } catch {
      // Ignore persistence failures (e.g., private mode/localStorage blocked).
    }
  }

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
