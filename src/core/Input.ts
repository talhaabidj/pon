/**
 * Maps physical keyboard input to game actions so scenes do not depend on raw keys.
 */
export type InputAction =
  | 'moveForward'
  | 'moveBackward'
  | 'moveLeft'
  | 'moveRight'
  | 'interact'
  | 'confirm'
  | 'cancel'
  | 'pause'
  | 'album'
  | 'settings';

const DEFAULT_KEY_BINDINGS = new Map<string, InputAction>([
  ['KeyW', 'moveForward'],
  ['ArrowUp', 'moveForward'],
  ['KeyS', 'moveBackward'],
  ['ArrowDown', 'moveBackward'],
  ['KeyA', 'moveLeft'],
  ['ArrowLeft', 'moveLeft'],
  ['KeyD', 'moveRight'],
  ['ArrowRight', 'moveRight'],
  ['KeyE', 'interact'],
  ['Enter', 'confirm'],
  ['Escape', 'cancel'],
  ['KeyP', 'pause'],
  ['KeyC', 'album'],
  ['Comma', 'settings'],
]);

export class Input {
  private readonly pressedActions = new Set<InputAction>();
  private readonly keyBindings = new Map(DEFAULT_KEY_BINDINGS);
  private enabled = true;

  public constructor(private readonly target: HTMLElement | Window = window) {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.clear);
  }

  public isPressed(action: InputAction): boolean {
    return this.enabled && this.pressedActions.has(action);
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.pressedActions.clear();
    }
  }

  public destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.clear);
    this.pressedActions.clear();
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const action = this.keyBindings.get(event.code);
    if (!this.enabled || !action || this.isTypingTarget(event.target)) {
      return;
    }

    event.preventDefault();
    this.pressedActions.add(action);
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    const action = this.keyBindings.get(event.code);
    if (!action) {
      return;
    }

    event.preventDefault();
    this.pressedActions.delete(action);
  };

  private readonly clear = (): void => {
    this.pressedActions.clear();
  };

  private isTypingTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
  }

  public getTarget(): HTMLElement | Window {
    return this.target;
  }
}
