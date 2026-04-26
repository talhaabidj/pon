/**
 * BedroomScene — First-person bedroom hub.
 *
 * The player wakes up here after clicking "Start Shift" on the Desktop.
 * They can explore the room, interact with the PC (profile), collection
 * wall (album), and walk to the door to begin the night shift.
 *
 * Uses the shared FirstPersonController for movement/look.
 * Uses InteractionSystem for raycaster-based "Press E" prompts.
 *
 * M5: Loads/saves game state; populates PC stats and collection from save.
 */

import * as THREE from 'three';
import type { Scene, GameState } from '../data/types.js';
import type { Game } from '../core/Game.js';
import { gameAudio } from '../core/Audio.js';
import '../styles/bedroom.css';
import { FirstPersonController } from '../core/FirstPersonController.js';
import { InteractionSystem } from '../core/InteractionSystem.js';
import { requestPointerLockSafely } from '../core/PointerLock.js';
import { PLAYER_HEIGHT } from '../core/Config.js';
import type { BedroomCollider } from '../world/Bedroom.js';
import { buildBedroom } from '../world/Bedroom.js';
import { updateCollectionWallVisuals } from '../world/props/CollectionWall.js';
import { loadGameState, createDefaultGameState, saveGameState } from '../core/Save.js';
import { getItemById } from '../data/items.js';
import { CollectionSystem } from '../systems/CollectionSystem.js';
import { EconomySystem } from '../systems/EconomySystem.js';
import { ProgressionSystem } from '../systems/ProgressionSystem.js';
import { PauseSceneController } from './shared/PauseSceneController.js';
import { getSceneRouter } from './SceneRouter.js';
import { clampBedroomPosition } from './bedroom/BedroomCollision.js';
import { BedroomInteractIndicators } from './bedroom/BedroomInteractIndicators.js';
import { routeBedroomInteraction } from './bedroom/BedroomInteractionRouter.js';
import { BedroomStartGate } from './bedroom/BedroomStartGate.js';
import {
  createBlackFadeOverlay,
  fadeToBlack,
  playDesktopReturnTransition,
} from './bedroom/BedroomTransitions.js';
import {
  mountBedroomUI,
  unmountBedroomUI,
  showInteractPrompt,
  hideInteractPrompt,
  hidePCOverlay,
  isPCOverlayVisible,
  hideCollectionOverlay,
  isCollectionOverlayVisible,
  isAnyOverlayOpen,
  openCollectionViewer,
  navigateCollection,
} from '../ui/bedroomUI.js';
import {
  mountPauseUI,
  unmountPauseUI,
  hidePauseMenu,
  isPauseMenuVisible,
} from '../ui/pauseUI.js';

export class BedroomScene implements Scene {
  private game: Game;
  private scene3d: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controller: FirstPersonController;
  private interaction: InteractionSystem;
  private pauseController: PauseSceneController;

  // Persisted state
  private gameState: GameState;
  private colliders: BedroomCollider[] = [];
  private interactIndicators: BedroomInteractIndicators;
  private windowVoidAnimator: ((timeSeconds: number) => void) | null = null;
  private startGate: BedroomStartGate;
  private isNightShiftStarting = false;
  private isReturningToDesktop = false;
  private showStartGateOnLoad: boolean;

  constructor(
    game: Game,
    gameState?: GameState,
    options?: { showStartGateOnLoad?: boolean },
  ) {
    this.game = game;
    this.scene3d = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    this.controller = new FirstPersonController(
      this.game.canvas,
      this.game.input,
    );
    this.pauseController = new PauseSceneController({
      controller: this.controller,
      canvas: this.game.canvas,
      setPaused: (paused) => {
        this.game.isPaused = paused;
      },
    });
    this.interaction = new InteractionSystem();
    this.interactIndicators = new BedroomInteractIndicators(this.scene3d);
    this.startGate = new BedroomStartGate({
      canvas: this.game.canvas,
      setControllerEnabled: (enabled) => {
        this.controller.setEnabled(enabled);
      },
      onShown: () => {
        hideInteractPrompt();
      },
      onStarted: () => {
        gameAudio.play('ui');
      },
    });

    // Load game state: use passed-in (from shop return) or load from save
    this.gameState = gameState ?? loadGameState() ?? createDefaultGameState();
    this.showStartGateOnLoad = options?.showStartGateOnLoad ?? false;
  }

  init() {
    // —— Build the bedroom world ——
    const { group, interactables, colliders } = buildBedroom();
    this.scene3d.add(group);
    this.colliders = colliders;

    const windowObj = group.getObjectByName('window');
    const animateVoid = windowObj?.userData['animateVoid'];
    if (typeof animateVoid === 'function') {
      this.windowVoidAnimator = animateVoid as (timeSeconds: number) => void;
    }

    // —— Register interactables ——
    this.interaction.setInteractables(interactables);
    this.interactIndicators.sync(interactables);

    // —— Camera start position (center of room, facing door) ——
    this.camera.position.set(0.5, PLAYER_HEIGHT, 0.5);
    this.controller.attach(this.camera);
    this.controller.setLookAngles(Math.PI, 0);

    // —— Mount UI ——
    mountBedroomUI();
    mountPauseUI();
    if (this.showStartGateOnLoad) {
      this.showBedroomStartOverlay();
    } else {
      // Only pause/resume should intentionally show the click gate.
      // Normal scene entry stays playable and attempts to relock cursor
      // immediately when the browser still considers the transition activated.
      void requestPointerLockSafely(this.game.canvas);
    }
    // Shop preload is non-critical while the bedroom first appears.
    // Schedule it in idle time so first-look input stays responsive.
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    };
    if (win.requestIdleCallback) {
      win.requestIdleCallback(() => {
        void getSceneRouter().warmShopRoute();
      }, { timeout: 2200 });
    } else {
      setTimeout(() => {
        void getSceneRouter().warmShopRoute();
      }, 450);
    }

    // —— Pause Logic ——
    this.controller.onPause = () => {
      // If an overlay is open, ignore pause-triggered unlock events and let
      // the overlay close flow handle it (Q key / close button).
      if (!isAnyOverlayOpen()) {
        this.openPauseMenu();
      }
    };

    // —— Update 3D collection wall with owned items ——
    const collWall = group.getObjectByName('collection-wall');
    if (collWall) {
      const ownedItems = this.gameState.ownedItemIds
        .map((id) => getItemById(id))
        .filter((item): item is NonNullable<typeof item> => item != null);
      updateCollectionWallVisuals(collWall as THREE.Group, ownedItems);
    }

    // —— Resize ——
    window.addEventListener('resize', this.onResize);

    // —— Save state on entering bedroom ——
    saveGameState(this.gameState);
  }

  update(dt: number) {
    const input = this.game.input;
    const timeNow = performance.now() * 0.001;
    this.windowVoidAnimator?.(timeNow);
    this.interactIndicators.update(timeNow);

    if (this.startGate.isWaiting()) {
      // Guard against pointer-lock races from scene enter; if lock is active,
      // the browser can keep routing clicks to canvas instead of the overlay.
      if (document.pointerLockElement === this.game.canvas) {
        document.exitPointerLock();
      }
      this.game.renderer.render(this.scene3d, this.camera);
      return;
    }

    // —— Pause menu handling ——
    if (isPauseMenuVisible()) {
      if (input.isMenuPressed()) {
        this.pauseController.requestResumeFromToggle();
      }
      this.pauseController.handlePausedFrame();

      this.game.renderer.render(this.scene3d, this.camera);
      return;
    }

    // —— Click-to-start overlay (post-pause) ——
    if (this.pauseController.isClickToStartVisible()) {
      this.game.renderer.render(this.scene3d, this.camera);
      return;
    }

    // —— Overlay handling ——
    if (isAnyOverlayOpen()) {
      const pcOpen = isPCOverlayVisible();

      // PC overlay needs cursor; collection should stay pointer-locked.
      if (pcOpen) {
        this.controller.setEnabled(false);
      } else if (!this.controller.isEnabled()) {
        this.controller.setEnabled(true);
      }

      // Collection viewer A/D navigation
      if (isCollectionOverlayVisible()) {
        if (input.isKeyJustPressed('KeyA')) {
          navigateCollection(-1);
        }
        if (input.isKeyJustPressed('KeyD')) {
          navigateCollection(1);
        }
      }

      // Q closes overlays. ESC is reserved for pause to avoid pointer-lock double-press behavior.
      if (input.isKeyJustPressed('KeyQ')) {
        hidePCOverlay();
        hideCollectionOverlay();
        this.controller.setEnabled(true);
        requestPointerLockSafely(this.game.canvas);
      }

      // Render but don't process movement
      this.game.renderer.render(this.scene3d, this.camera);
      return;
    }

    // Explicit ESC pause path keeps pause reliable even if pointer lock is
    // already desynced or not currently active.
    if (input.isMenuPressed()) {
      this.openPauseMenu();
      this.game.renderer.render(this.scene3d, this.camera);
      return;
    }

    // —— Cursor Free Toggle ——
    if (input.isCursorTogglePressed()) {
      this.controller.toggleCursorFree();
    }

    // Ensure controller is enabled when no overlay
    if (!this.controller.isEnabled()) {
      this.controller.setEnabled(true);
    }

    // —— Movement ——
    this.controller.update(dt);

    // —— Simple room bounds collision ——
    clampBedroomPosition(this.camera.position, this.colliders);

    // —— Interaction detection ——
    const target = this.interaction.check(this.camera);

    if (target) {
      showInteractPrompt(target.prompt);

      // Handle E press
      if (input.isInteractPressed()) {
        this.handleInteraction(target.type);
      }
    } else {
      hideInteractPrompt();
    }

    // —— Render ——
    this.game.renderer.render(this.scene3d, this.camera);
  }

  dispose() {
    this.controller.detach();
    this.controller.dispose();
    this.interaction.dispose();
    unmountBedroomUI();
    unmountPauseUI();
    window.removeEventListener('resize', this.onResize);

    // Dispose 3D resources
    this.scene3d.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });

    this.colliders = [];
    this.windowVoidAnimator = null;
    this.pauseController.dispose();
    this.interactIndicators.dispose();
    this.startGate.dispose();
    this.isNightShiftStarting = false;
    this.isReturningToDesktop = false;
  }

  // —— Interaction handlers ——

  private handleInteraction(type: string) {
    routeBedroomInteraction(type, {
      onPc: () => {
        hideInteractPrompt();
        void this.returnToDesktopStart();
      },
      onCollection: () => {
        gameAudio.play('ui');
        openCollectionViewer(this.gameState.ownedItemIds);
        this.controller.setEnabled(true);
        requestPointerLockSafely(this.game.canvas);
      },
      onDoor: () => {
        this.startNightShift();
      },
    });
  }

  private showBedroomStartOverlay() {
    this.startGate.show();
  }

  private startNightShift() {
    if (this.isNightShiftStarting) return;

    hideInteractPrompt();
    this.isNightShiftStarting = true;
    gameAudio.play('transition');
    void this.beginNightShiftTransition();
  }

  private async beginNightShiftTransition() {
    const fade = createBlackFadeOverlay();
    await fadeToBlack(fade, 700);

    // Create systems from save state
    const economy = new EconomySystem(this.gameState.money, this.gameState.tokens);
    const collection = new CollectionSystem(this.gameState.ownedItemIds);
    const progression = new ProgressionSystem(
      this.gameState.nightsWorked,
      this.gameState.secretsTriggered,
    );

    await getSceneRouter().toShop(
      this.game,
      economy,
      collection,
      progression,
      this.gameState.totalMoneyEarned,
    );

    // Remove fade (the new scene will handle its own visuals)
    fade.remove();
  }

  private async returnToDesktopStart() {
    if (this.isReturningToDesktop) return;
    this.isReturningToDesktop = true;
    gameAudio.play('transition');

    const transitionOverlay = await playDesktopReturnTransition();

    this.controller.setEnabled(false);
    if (document.pointerLockElement === this.game.canvas) {
      document.exitPointerLock();
    }

    this.startGate.hide();

    hidePCOverlay();
    hideCollectionOverlay();
    hidePauseMenu();
    this.game.isPaused = false;
    saveGameState(this.gameState);

    await getSceneRouter().toDesktop(this.game);

    transitionOverlay.style.opacity = '0';
    window.setTimeout(() => {
      transitionOverlay.remove();
    }, 180);
  }

  // —— Simple AABB room collision ——

  private openPauseMenu() {
    if (isPauseMenuVisible()) return;
    if (this.pauseController.isClickToStartVisible()) return;
    this.pauseController.openPauseMenu();
  }

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  };
}
