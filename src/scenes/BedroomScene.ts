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
import { FirstPersonController } from '../core/FirstPersonController.js';
import { InteractionSystem } from '../core/InteractionSystem.js';
import { PLAYER_HEIGHT } from '../core/Config.js';
import { buildBedroom } from '../world/Bedroom.js';
import { updateCollectionWallVisuals } from '../world/props/CollectionWall.js';
import { loadGameState, createDefaultGameState, saveGameState } from '../core/Save.js';
import { getItemById } from '../data/items.js';
import { CollectionSystem } from '../systems/CollectionSystem.js';
import { EconomySystem } from '../systems/EconomySystem.js';
import { ProgressionSystem } from '../systems/ProgressionSystem.js';
import {
  mountBedroomUI,
  unmountBedroomUI,
  showInteractPrompt,
  hideInteractPrompt,
  showPCOverlay,
  hidePCOverlay,
  hideCollectionOverlay,
  isCollectionOverlayVisible,
  isAnyOverlayOpen,
  updatePCStats,
  openCollectionViewer,
  navigateCollection,
} from '../ui/bedroomUI.js';
import {
  mountPauseUI,
  unmountPauseUI,
  showPauseMenu,
  hidePauseMenu,
  isPauseMenuVisible,
} from '../ui/pauseUI.js';

// Room bounds for collision
const ROOM_HALF_W = 2.3; // slightly inside 2.5 walls
const ROOM_HALF_D = 1.8; // slightly inside 2.0 walls

export class BedroomScene implements Scene {
  private game: Game;
  private scene3d: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controller: FirstPersonController;
  private interaction: InteractionSystem;

  // Persisted state
  private gameState: GameState;

  constructor(game: Game, gameState?: GameState) {
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
    this.interaction = new InteractionSystem();

    // Load game state: use passed-in (from shop return) or load from save
    this.gameState = gameState ?? loadGameState() ?? createDefaultGameState();
  }

  init() {
    // —— Build the bedroom world ——
    const { group, interactables } = buildBedroom();
    this.scene3d.add(group);

    // —— Register interactables ——
    this.interaction.setInteractables(interactables);

    // —— Camera start position (center of room, facing door) ——
    this.camera.position.set(0, PLAYER_HEIGHT, 0.5);
    this.controller.attach(this.camera);

    // —— Mount UI ——
    mountBedroomUI();
    mountPauseUI();

    // —— Pause Logic ——
    this.controller.onPause = () => {
      // If we are actually viewing an overlay natively (like PC or Collection),
      // ESC simply closes that overlay in update(). But if we are freely walking:
      if (!isAnyOverlayOpen()) {
        this.game.isPaused = true;
        showPauseMenu(() => {
          hidePauseMenu();
          this.game.isPaused = false;
          this.game.canvas.requestPointerLock();
        });
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

    // —— Handle overlay toggling ——
    if (isAnyOverlayOpen() || isPauseMenuVisible()) {
      // Controller disabled while overlay is open
      this.controller.setEnabled(false);

      // Collection viewer A/D navigation
      if (isCollectionOverlayVisible()) {
        if (input.isKeyJustPressed('KeyA')) {
          navigateCollection(-1);
        }
        if (input.isKeyJustPressed('KeyD')) {
          navigateCollection(1);
        }
      }

      // Escape to close overlays or pause menu
      if (input.isMenuPressed()) {
        if (isPauseMenuVisible()) {
          hidePauseMenu();
          this.game.isPaused = false;
          this.game.canvas.requestPointerLock();
        } else {
          hidePCOverlay();
          hideCollectionOverlay();
        }
        this.controller.setEnabled(true);
      }

      // Render but don't process movement
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
    this.clampPosition();

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
  }

  // —— Interaction handlers ——

  private handleInteraction(type: string) {
    switch (type) {
      case 'pc':
        updatePCStats(this.gameState);
        showPCOverlay();
        this.controller.setEnabled(false);
        break;

      case 'collection':
        openCollectionViewer(this.gameState.ownedItemIds);
        this.controller.setEnabled(false);
        break;

      case 'door':
        this.startNightShift();
        break;
    }
  }

  private async startNightShift() {
    this.controller.setEnabled(false);
    hideInteractPrompt();

    // Quick fade out
    const fade = document.createElement('div');
    fade.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: #000; z-index: 50; opacity: 0;
      transition: opacity 0.6s ease;
    `;
    document.body.appendChild(fade);

    // Trigger fade
    requestAnimationFrame(() => {
      fade.style.opacity = '1';
    });

    // Wait for fade, then transition
    await new Promise((r) => setTimeout(r, 700));

    // Create systems from save state
    const economy = new EconomySystem(this.gameState.money, this.gameState.tokens);
    const collection = new CollectionSystem(this.gameState.ownedItemIds);
    const progression = new ProgressionSystem(this.gameState.nightsWorked);

    const { ShopScene } = await import('./ShopScene.js');
    await this.game.sceneManager.switchTo(
      new ShopScene(this.game, economy, collection, progression),
    );

    // Remove fade (the new scene will handle its own visuals)
    fade.remove();
  }

  // —— Simple AABB room collision ——

  private clampPosition() {
    const pos = this.camera.position;
    pos.x = Math.max(-ROOM_HALF_W, Math.min(ROOM_HALF_W, pos.x));
    pos.z = Math.max(-ROOM_HALF_D, Math.min(ROOM_HALF_D, pos.z));
    pos.y = PLAYER_HEIGHT; // keep on ground
  }

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  };
}
