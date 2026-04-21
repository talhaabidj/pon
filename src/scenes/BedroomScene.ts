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
import { FirstPersonController } from '../core/FirstPersonController.js';
import { InteractionSystem } from '../core/InteractionSystem.js';
import { requestPointerLockSafely } from '../core/PointerLock.js';
import { getInteractType } from '../core/InteractionTags.js';
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
import { clampBedroomPosition } from './bedroom/BedroomCollision.js';
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
  private bedroomInteractIndicators: THREE.Group[] = [];
  private windowVoidAnimator: ((timeSeconds: number) => void) | null = null;
  private awaitingBedroomStartClick = false;
  private isNightShiftStarting = false;
  private isReturningToDesktop = false;
  private bedroomStartOverlayEl: HTMLDivElement | null = null;
  private showStartGateOnLoad: boolean;
  private shopScenePreload:
    | Promise<typeof import('./ShopScene.js') | null>
    | null = null;

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

    // Load game state: use passed-in (from shop return) or load from save
    this.gameState = gameState ?? loadGameState() ?? createDefaultGameState();
    this.showStartGateOnLoad = options?.showStartGateOnLoad ?? gameState === undefined;
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
    this.createBedroomInteractIndicators(interactables);

    // —— Camera start position (center of room, facing door) ——
    this.camera.position.set(0.5, PLAYER_HEIGHT, 0.5);
    this.controller.attach(this.camera);
    this.controller.setLookAngles(Math.PI, 0);

    // —— Mount UI ——
    mountBedroomUI();
    mountPauseUI();
    if (this.showStartGateOnLoad) {
      this.showBedroomStartOverlay();
    }
    void this.preloadShopScene();

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
    this.updateBedroomInteractIndicators(timeNow);

    if (this.awaitingBedroomStartClick) {
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
    this.disposeBedroomInteractIndicators();
    this.bedroomStartOverlayEl?.remove();
    this.bedroomStartOverlayEl = null;
    this.awaitingBedroomStartClick = false;
    this.isNightShiftStarting = false;
    this.isReturningToDesktop = false;
    this.shopScenePreload = null;
  }

  // —— Interaction handlers ——

  private handleInteraction(type: string) {
    switch (type) {
      case 'pc':
        hideInteractPrompt();
        void this.returnToDesktopStart();
        break;

      case 'collection':
        gameAudio.play('ui');
        openCollectionViewer(this.gameState.ownedItemIds);
        this.controller.setEnabled(true);
        requestPointerLockSafely(this.game.canvas);
        break;

      case 'door':
        this.startNightShift();
        break;
    }
  }

  private showBedroomStartOverlay() {
    if (this.awaitingBedroomStartClick || this.bedroomStartOverlayEl) return;

    this.awaitingBedroomStartClick = true;
    this.controller.setEnabled(false);
    hideInteractPrompt();

    if (document.pointerLockElement === this.game.canvas) {
      document.exitPointerLock();
    }

    const overlay = document.createElement('div');
    overlay.id = 'bedroom-shift-start-overlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 1300;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(10, 12, 18, 0.52);
      backdrop-filter: blur(6px) saturate(0.72);
      cursor: pointer;
      user-select: none;
      transition: opacity 0.16s ease;
    `;

    const title = document.createElement('div');
    title.innerText = 'CLICK TO START';
    title.style.cssText = `
      color: #ffffff;
      font-family: 'Segoe UI', sans-serif;
      font-size: clamp(1.8rem, 4vw, 2.4rem);
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      text-shadow: 0 0 26px rgba(255, 255, 255, 0.22);
    `;

    overlay.appendChild(title);

    const beginFromOverlay = () => {
      if (!this.awaitingBedroomStartClick) return;

      gameAudio.play('ui');
      this.awaitingBedroomStartClick = false;
      this.bedroomStartOverlayEl = null;

      overlay.style.opacity = '0';
      window.setTimeout(() => {
        overlay.remove();
      }, 160);

      this.controller.setEnabled(true);
      requestPointerLockSafely(this.game.canvas);
    };

    overlay.addEventListener('pointerdown', beginFromOverlay);
    overlay.addEventListener('click', beginFromOverlay);

    this.bedroomStartOverlayEl = overlay;
    document.body.appendChild(overlay);
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

    const preloadedModule = await this.preloadShopScene();
    const { ShopScene } = preloadedModule ?? await import('./ShopScene.js');
    await this.game.sceneManager.switchTo(
      new ShopScene(
        this.game,
        economy,
        collection,
        progression,
        this.gameState.totalMoneyEarned,
      ),
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

    this.awaitingBedroomStartClick = false;
    this.bedroomStartOverlayEl?.remove();
    this.bedroomStartOverlayEl = null;

    hidePCOverlay();
    hideCollectionOverlay();
    hidePauseMenu();
    this.game.isPaused = false;
    saveGameState(this.gameState);

    const { DesktopScene } = await import('./DesktopScene.js');
    await this.game.sceneManager.switchTo(new DesktopScene(this.game));

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

  private preloadShopScene() {
    if (!this.shopScenePreload) {
      this.shopScenePreload = import('./ShopScene.js').catch(() => null);
    }
    return this.shopScenePreload;
  }

  private createBedroomInteractIndicators(interactables: THREE.Object3D[]) {
    this.disposeBedroomInteractIndicators();

    for (const obj of interactables) {
      const type = getInteractType(obj);
      let color = 0x7c6ef0;
      if (type === 'pc') color = 0x6ebeff;
      if (type === 'collection') color = 0xd890ff;
      if (type === 'door') color = 0xffc66e;

      const bounds = new THREE.Box3().setFromObject(obj);
      if (!Number.isFinite(bounds.min.x) || !Number.isFinite(bounds.max.y)) {
        continue;
      }

      const marker = new THREE.Group();

      const glowTex = this.createSoftGlowTexture(color);
      const glowMat = new THREE.MeshBasicMaterial({
        map: glowTex,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.62,
      });
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), glowMat);
      glow.name = 'interact-glow';
      glow.rotation.x = -Math.PI / 2;
      marker.add(glow);

      const beaconMat = new THREE.MeshStandardMaterial({
        color: 0xecf6ff,
        emissive: color,
        emissiveIntensity: 0.9,
        roughness: 0.2,
        metalness: 0.1,
      });
      const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.03, 0), beaconMat);
      beacon.name = 'interact-beacon';
      marker.add(beacon);

      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.007, 0.009, 0.1, 8),
        new THREE.MeshStandardMaterial({
          color: 0xaedfff,
          emissive: color,
          emissiveIntensity: 0.45,
          roughness: 0.35,
          metalness: 0.2,
          transparent: true,
          opacity: 0.85,
        }),
      );
      stem.name = 'interact-stem';
      marker.add(stem);

      const centerX = (bounds.min.x + bounds.max.x) * 0.5;
      const centerZ = (bounds.min.z + bounds.max.z) * 0.5;
      const floorY = bounds.min.y + 0.025;
      const topY = bounds.max.y + 0.17;

      marker.position.set(centerX, 0, centerZ);
      glow.position.y = floorY;
      beacon.position.y = topY;
      stem.position.y = topY - 0.06;

      marker.userData['baseY'] = topY;
      marker.userData['floorY'] = floorY;
      marker.userData['phase'] = this.bedroomInteractIndicators.length * 0.72;

      this.scene3d.add(marker);
      this.bedroomInteractIndicators.push(marker);
    }
  }

  private updateBedroomInteractIndicators(timeSeconds: number) {
    this.bedroomInteractIndicators.forEach((marker) => {
      const baseY = (marker.userData['baseY'] as number | undefined) ?? 1;
      const floorY = (marker.userData['floorY'] as number | undefined) ?? 0.05;
      const phase = (marker.userData['phase'] as number | undefined) ?? 0;

      const bob = Math.sin(timeSeconds * 1.95 + phase) * 0.026;
      const pulse = 0.72 + (Math.sin(timeSeconds * 2.6 + phase) * 0.28);

      const beacon = marker.getObjectByName('interact-beacon') as THREE.Mesh | undefined;
      if (beacon) {
        beacon.position.y = baseY + bob;
        beacon.rotation.y += 0.013;
        const scale = 0.86 + pulse * 0.22;
        beacon.scale.set(scale, scale, scale);
      }

      const stem = marker.getObjectByName('interact-stem') as THREE.Mesh | undefined;
      if (stem) {
        stem.position.y = (baseY - 0.06) + bob * 0.6;
      }

      const glow = marker.getObjectByName('interact-glow') as THREE.Mesh | undefined;
      if (glow) {
        glow.position.y = floorY;
        glow.rotation.z += 0.004;
        const glowScale = 0.92 + pulse * 0.22;
        glow.scale.set(glowScale, glowScale, glowScale);
        if (glow.material instanceof THREE.MeshBasicMaterial) {
          glow.material.opacity = 0.42 + pulse * 0.22;
        }
      }
    });
  }

  private createSoftGlowTexture(colorHex: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const color = new THREE.Color(colorHex);
      const r = Math.round(color.r * 255);
      const g = Math.round(color.g * 255);
      const b = Math.round(color.b * 255);
      const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 56);
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.92)`);
      grad.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.45)`);
      grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  private disposeBedroomInteractIndicators() {
    this.bedroomInteractIndicators.forEach((marker) => {
      marker.removeFromParent();
      marker.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });
    this.bedroomInteractIndicators = [];
  }

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  };
}
