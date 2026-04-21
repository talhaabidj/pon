/**
 * Input — Centralized keyboard and mouse state.
 *
 * Tracks which keys are currently held and provides high-level queries
 * like movement vectors and interaction presses. Pointer lock state
 * is managed by FirstPersonController.
 */

export class Input {
  private keysDown = new Set<string>();
  private keysJustPressed = new Set<string>();
  private mouseDeltaX = 0;
  private mouseDeltaY = 0;

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('pointerlockchange', this.clearMouseDelta);
  }

  // —— Event handlers ——

  private onKeyDown = (e: KeyboardEvent) => {
    const key = e.code;
    if (!this.keysDown.has(key)) {
      this.keysJustPressed.add(key);
    }
    this.keysDown.add(key);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keysDown.delete(e.code);
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!document.pointerLockElement) return;

    this.mouseDeltaX += e.movementX;
    this.mouseDeltaY += e.movementY;
  };

  private clearMouseDelta = () => {
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
  };

  // —— Queries ——

  /** Returns a normalized {x, z} movement vector from WASD/arrow keys */
  getMovementVector(): { x: number; z: number } {
    let x = 0;
    let z = 0;

    if (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp')) z -= 1;
    if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) z += 1;
    if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) x -= 1;
    if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) x += 1;

    // Normalize diagonal movement
    const len = Math.sqrt(x * x + z * z);
    if (len > 0) {
      x /= len;
      z /= len;
    }

    return { x, z };
  }

  isRunning(): boolean {
    return this.keysDown.has('ShiftLeft') || this.keysDown.has('ShiftRight');
  }

  isInteractPressed(): boolean {
    return this.keysJustPressed.has('KeyE');
  }

  isServicePressed(): boolean {
    return this.keysJustPressed.has('KeyR');
  }

  isMenuPressed(): boolean {
    return this.keysJustPressed.has('Escape');
  }

  isCursorTogglePressed(): boolean {
    return this.keysJustPressed.has('ControlLeft');
  }

  isKeyDown(code: string): boolean {
    return this.keysDown.has(code);
  }

  isKeyJustPressed(code: string): boolean {
    return this.keysJustPressed.has(code);
  }

  getMouseDelta(): { x: number; y: number } {
    return { x: this.mouseDeltaX, y: this.mouseDeltaY };
  }

  /** Must be called at end of each frame to reset per-frame state */
  endFrame() {
    this.keysJustPressed.clear();
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
  }

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('pointerlockchange', this.clearMouseDelta);
  }
}
