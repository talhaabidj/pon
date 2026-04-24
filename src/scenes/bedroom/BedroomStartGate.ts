import { requestPointerLockSafely } from '../../core/PointerLock.js';
import { ClickToStartOverlay } from '../../ui/ClickToStartOverlay.js';

export interface BedroomStartGateDeps {
  canvas: HTMLCanvasElement;
  setControllerEnabled: (enabled: boolean) => void;
  onStarted: () => void;
  onShown?: () => void;
}

export class BedroomStartGate {
  private readonly deps: BedroomStartGateDeps;
  private overlay: ClickToStartOverlay | null = null;
  private waitingForClick = false;

  constructor(deps: BedroomStartGateDeps) {
    this.deps = deps;
  }

  show() {
    if (this.waitingForClick) return;

    this.waitingForClick = true;
    this.deps.onShown?.();
    this.deps.setControllerEnabled(false);

    if (document.pointerLockElement === this.deps.canvas) {
      document.exitPointerLock();
    }

    if (!this.overlay) {
      this.overlay = new ClickToStartOverlay({
        id: 'bedroom-shift-start-overlay',
        zIndex: 1300,
        onActivate: () => this.activate(),
      });
    }

    this.overlay.show();
  }

  hide() {
    this.waitingForClick = false;
    this.overlay?.hide();
  }

  isWaiting() {
    return this.waitingForClick;
  }

  dispose() {
    this.waitingForClick = false;
    this.overlay?.dispose();
    this.overlay = null;
  }

  private activate() {
    if (!this.waitingForClick) return;

    this.waitingForClick = false;
    this.overlay?.hide();
    this.deps.setControllerEnabled(true);
    requestPointerLockSafely(this.deps.canvas);
    this.deps.onStarted();
  }
}
