/**
 * ShopScene — The night gacha shop gameplay scene.
 *
 * Wires together all game systems:
 * - TimeSystem (in-game clock)
 * - TaskSystem (nightly tasks)
 * - MaintenanceSystem (machine state)
 * - EconomySystem (money/tokens)
 * - CapsuleSystem (gacha pulls)
 * - CollectionSystem (item tracking)
 * - ProgressionSystem (night progression)
 *
 * Player walks the floor, completes tasks, buys tokens,
 * pulls capsules, and returns home when the night ends.
 */

import * as THREE from 'three';
import type {
  Scene,
  MachineDefinition,
  MachineState,
  GameState,
} from '../data/types.js';
import type { Game } from '../core/Game.js';
import { gameAudio } from '../core/Audio.js';
import '../styles/shop.css';
import { FirstPersonController } from '../core/FirstPersonController.js';
import { InteractionSystem } from '../core/InteractionSystem.js';
import { requestPointerLockSafely } from '../core/PointerLock.js';
import { formatCurrencyDelta } from '../core/Currency.js';
import {
  JACKPOT_CAPSULE_CHANCE,
  JACKPOT_TOKEN_BONUS,
  JACKPOT_TOKEN_CHANCE,
  JAM_SERVICE_BONUS_CAPSULE_CHANCE,
  PULL_TIME_COST,
  SECRET_DISCOVERY_BONUS,
  SHINY_ACCENT_COLOR,
  SHINY_PULL_CHANCE,
} from '../core/Config.js';
import { loadGameState, saveGameState } from '../core/Save.js';

// Systems
import { TimeSystem } from '../systems/TimeSystem.js';
import { TaskSystem } from '../systems/TaskSystem.js';
import { MaintenanceSystem } from '../systems/MaintenanceSystem.js';
import { EconomySystem } from '../systems/EconomySystem.js';
import { CapsuleSystem } from '../systems/CapsuleSystem.js';
import { CollectionSystem } from '../systems/CollectionSystem.js';
import { ProgressionSystem } from '../systems/ProgressionSystem.js';

// Data
import { MACHINES } from '../data/machines.js';
import { TASK_TEMPLATES } from '../data/tasks.js';
import { getItemById, ITEMS } from '../data/items.js';
import {
  restockMachineCapsules,
  triggerMachineCleanPulse,
  triggerMachinePowerPulse,
} from '../world/machines/CapsuleMachine.js';
import { MudSplashTaskSystem } from './shop/MudSplashTaskSystem.ts';
import {
  hasAnyRestockNeedInWorld,
} from './shop/RestockFallback.js';
import {
  getWondertradeStatus,
  rollWondertradeOutcome,
} from './shop/WondertradeResolver.js';
import {
  buildNightEndSummary,
  buildShopReturnGameState,
} from './shop/NightEndSnapshot.js';
import {
  canUseTokenStation,
} from './shop/TokenStationFlow.js';
import {
  getMachineOutOfOrderPrompt,
} from './shop/MachineIssuePrompts.js';
import { ShopHudPresenter } from './shop/ShopHudPresenter.js';
import {
  getContextualActions as getShopContextualActions,
  getContextualPrompt as getShopContextualPrompt,
} from './shop/ShopPromptRules.js';
import {
  INTERACTION_KEYS,
  getMachineId,
  getSecretId,
  getSecretName,
  getTargetId,
} from '../core/InteractionTags.js';
import {
  ARCADE_STATUS_TEXT,
} from './shop/ArcadeStatusText.js';
import { clampShopPosition } from './shop/ShopCollision.js';
import { updateShopTaskMarkers } from './shop/ShopTaskMarkers.js';

// World
import type { ShopCollider } from '../world/ShopFloor.js';
import { bindRuntimeToShopScene } from './shop/ShopSceneOrchestrator.js';
import { createShopRuntimeContext } from './shop/ShopRuntimeContext.js';

// UI
import {
  mountShopHUD,
  unmountShopHUD,
  updateTokenBalance,
  showShopPrompt,
  hideShopPrompt,
  showMachinePreview,
  hideMachinePreview,
  isMachinePreviewVisible,
  showPullResult,
  hidePullResult,
  isPullResultVisible,
  showTokenOverlay,
  hideTokenOverlay,
  isTokenOverlayVisible,
  showNightEndOverlay,
  hideNightEndOverlay,
  isNightEndVisible,
  showEndingSoon,
  hideEndingSoon,
  showToast,
} from '../ui/shopHUD.js';
import type { ShopPromptAction } from '../ui/shopHUD.js';
import {
  mountPauseUI,
  unmountPauseUI,
  isPauseMenuVisible,
} from '../ui/pauseUI.js';
import { PauseSceneController } from './shared/PauseSceneController.js';
import { getSceneRouter } from './SceneRouter.js';

export class ShopScene implements Scene {
  private game: Game;
  private scene3d: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controller: FirstPersonController;
  private interaction: InteractionSystem;
  private pauseController: PauseSceneController;
  private hudPresenter: ShopHudPresenter;

  // Systems
  private time: TimeSystem;
  private tasks: TaskSystem;
  private maintenance: MaintenanceSystem;
  private economy: EconomySystem;
  private capsule: CapsuleSystem;
  private collection: CollectionSystem;
  private progression: ProgressionSystem;
  private totalMoneyEarnedBeforeNight: number;

  // State
  private machineGroups = new Map<string, THREE.Group>();
  private tokenStationGroup: THREE.Group | null = null;
  private tokenStationState: MachineState = {
    machineId: 'token-station',
    cleanliness: 'clean',
    stockLevel: 'ok',
    isJammed: false,
    isPowered: true,
  };
  private mudSplashTasks: MudSplashTaskSystem | null = null;
  private colliders: ShopCollider[] = [];
  private availableMachines: MachineDefinition[] = [];
  private moneyEarnedThisNight = 0;
  private itemsObtainedThisNight: string[] = [];
  private nightEnded = false;
  private endingSoonShown = false;
  private witchingHourShown = false;
  private secretsTriggeredThisNight: string[] = [];
  private isPullInProgress = false;
  private isReturningHome = false;
  private hasCapsuleRefill = false;
  private hasTokenRefill = false;
  private previewMachineId: string | null = null;

  // Screen shake
  private shakeIntensity = 0;
  private shakeDuration = 0;
  private shakeTimer = 0;
  private machineAnimationTick = 0;

  constructor(
    game: Game,
    economy?: EconomySystem,
    collection?: CollectionSystem,
    progression?: ProgressionSystem,
    totalMoneyEarned = 0,
  ) {
    this.game = game;
    this.scene3d = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      200,
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
    this.hudPresenter = new ShopHudPresenter();
    this.interaction = new InteractionSystem();

    // Systems — use passed-in or create fresh
    this.economy = economy ?? new EconomySystem(200, 2);
    this.collection = collection ?? new CollectionSystem();
    this.progression = progression ?? new ProgressionSystem();
    this.totalMoneyEarnedBeforeNight = totalMoneyEarned;
    this.time = new TimeSystem();
    this.tasks = new TaskSystem();
    this.maintenance = new MaintenanceSystem();
    this.capsule = new CapsuleSystem();
  }

  async init() {
    this.hasCapsuleRefill = false;
    this.hasTokenRefill = false;

    // RectAreaLight shader setup is only needed in the shop scene.
    // Deferring it keeps initial route JS lighter for faster LCP.
    const { RectAreaLightUniformsLib } = await import(
      'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
    );
    RectAreaLightUniformsLib.init();

    const runtime = createShopRuntimeContext({
      progression: this.progression,
      maintenance: this.maintenance,
      tasks: this.tasks,
    });
    this.availableMachines = runtime.availableMachines;
    this.tokenStationState = runtime.tokenStationState;

    const runtimeBinding = bindRuntimeToShopScene(
      this.scene3d,
      this.interaction,
      this.camera,
      runtime,
    );
    this.machineGroups = runtimeBinding.machineGroups;
    this.tokenStationGroup = runtimeBinding.tokenStationGroup;
    this.colliders = runtimeBinding.colliders;

    // —— Spawn Task Targets (Mud Splashes) ——
    this.mudSplashTasks = new MudSplashTaskSystem(this.scene3d, this.colliders);
    this.mudSplashTasks.spawn(runtime.curatedTasks, runtimeBinding.interactables);
    // Mud splashes are appended after initial interactable binding, so refresh
    // the interaction cache to include floor-spot meshes for cleanup prompts.
    this.interaction.setInteractables(runtimeBinding.interactables);

    this.controller.attach(this.camera);

    // —— Mount HUD ——
    mountShopHUD();
    mountPauseUI();
    this.updateHUD();
    this.renderTasks();
    this.updateMachineTaskMarkers();
    this.updateTokenStationDisplay();

    // —— Pause Logic ——
    this.controller.onPause = () => {
      this.openPauseMenu();
    };

    // —— Wire token buy buttons ——
    document.querySelectorAll('.token-buy-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const count = Number((e.target as HTMLElement).dataset['count'] ?? 1);
        this.buyTokens(count);
      });
    });

    // —— Wire token overlay close ——
    document.getElementById('token-overlay-close')?.addEventListener('click', () => {
      hideTokenOverlay();
      this.controller.setEnabled(true);
      requestPointerLockSafely(this.game.canvas);
    });

    // —— Wire night continue button ——
    document.getElementById('night-continue')?.addEventListener('click', () => {
      this.returnHome();
    });
    document.getElementById('night-cancel')?.addEventListener('click', () => {
      this.dismissNightEndOverlay();
    });
    document.getElementById('machine-preview-close')?.addEventListener('click', () => {
      this.closeMachineDropPreview();
    });

    // —— Resize ——
    window.addEventListener('resize', this.onResize);
  }

  update(dt: number) {
    const input = this.game.input;

    // —— Pause Menu Toggle ——
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

    // —— Night end overlay active ——
    if (isNightEndVisible()) {
      if (input.isKeyJustPressed('KeyR')) {
        this.returnHome();
      } else if (input.isKeyJustPressed('KeyQ')) {
        this.dismissNightEndOverlay();
      }
      this.game.renderer.render(this.scene3d, this.camera);
      return;
    }

    // —— Pull result displayed ——
    if (isPullResultVisible()) {
      this.game.renderer.render(this.scene3d, this.camera);
      return;
    }

    // —— Pull anticipation lock (during crank animation) ——
    if (this.isPullInProgress) {
      this.game.renderer.render(this.scene3d, this.camera);
      return;
    }

    // —— Token overlay active ——
    if (isTokenOverlayVisible()) {
      this.controller.setEnabled(false);
      if (input.isMenuPressed()) {
        hideTokenOverlay();
        this.controller.setEnabled(true);
      }
      this.game.renderer.render(this.scene3d, this.camera);
      return;
    }

    // —— Machine drop preview open ——
    if (isMachinePreviewVisible()) {
      if (input.isKeyJustPressed('KeyQ')) {
        this.closeMachineDropPreview();
      }
      this.game.renderer.render(this.scene3d, this.camera);
      return;
    }

    // Explicit ESC pause path keeps pause reliable even if pointer lock is
    // temporarily desynced.
    if (input.isMenuPressed()) {
      this.openPauseMenu();
      this.game.renderer.render(this.scene3d, this.camera);
      return;
    }

    // —— Time system ——
    if (!this.nightEnded) {
      this.time.advanceRealTime(dt);
      this.hudPresenter.updateTime(
        this.time.getFormattedTime(),
        this.time.getNightProgress(),
      );

      // Ending soon warning
      if (this.time.isEndingSoon() && !this.endingSoonShown) {
        showEndingSoon();
        this.endingSoonShown = true;
      }

      // Night over
      if (this.time.isOver()) {
        this.endNight();
      }

      // 3 AM witching hour event
      if (this.time.getCurrentHour() === 3 && !this.witchingHourShown) {
        this.witchingHourShown = true;
        showToast('🌙 3:00 AM — The witching hour... rare items stir.', 5000);
      }
    }

    // Updating every machine every frame causes worst-case frame spikes.
    // Near machines stay full-rate; far machines update on reduced cadence.
    const timeNow = performance.now() * 0.001;
    const cameraPos = this.camera.position;
    this.machineAnimationTick = (this.machineAnimationTick + 1) % 12;
    this.machineGroups.forEach((mGroup, id) => {
      const animate = mGroup.userData['animate'] as
        | ((time: number, state?: MachineState) => void)
        | undefined;
      if (!animate) return;

      const dx = mGroup.position.x - cameraPos.x;
      const dz = mGroup.position.z - cameraPos.z;
      const distSq = dx * dx + dz * dz;
      let cadence = 1;
      if (distSq > 196) cadence = 4;
      else if (distSq > 81) cadence = 2;
      if ((this.machineAnimationTick % cadence) !== 0) return;

      const state = this.maintenance.getState(id);
      animate(timeNow, state);
    });

    // —— Movement ——
    if (!this.controller.isEnabled()) {
      this.controller.setEnabled(true);
    }
    
    // —— Cursor Free Toggle ——
    if (input.isCursorTogglePressed()) {
      this.controller.toggleCursorFree();
    }
    
    this.controller.update(dt);
    this.clampPosition();

    // —— Interaction check ——
    const target = this.interaction.check(this.camera);

    if (target) {
      if (this.nightEnded) {
        if (target.type === 'shop-exit') {
          showShopPrompt({
            text: 'Shift complete - press E to open return menu',
            actions: [{ key: 'E', label: 'Return Menu' }],
          });
          if (input.isInteractPressed()) {
            this.openNightEndOverlay();
          }
        } else {
          hideShopPrompt();
        }
      } else {
        // Build contextual prompt
        const prompt = this.getContextualPrompt(target.type, target.prompt, target.object);
        const promptActions = this.getContextualActions(target.type, target.object);
        showShopPrompt({
          title: target.type === 'machine' ? target.prompt : undefined,
          text: prompt,
          actions: promptActions,
        });

        if (target.type === 'machine' && input.isKeyJustPressed('KeyF')) {
          const machineId = getMachineId(target.object);
          if (machineId) {
            this.toggleMachineDropPreview(machineId);
          }
          this.game.renderer.render(this.scene3d, this.camera);
          return;
        }

        const serviceHandled = input.isServicePressed()
          ? this.handleServiceInput(target.type, target.object)
          : false;

        if (!serviceHandled && input.isInteractPressed()) {
          this.handleInteraction(target.type, target.object);
        }
      }
    } else {
      hideShopPrompt();
    }

    // —— Screen shake ——
    let baseShakeX = this.camera.position.x;
    let baseShakeY = this.camera.position.y;
    let baseShakeZ = this.camera.position.z;
    let shakeApplied = false;

    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const t = this.shakeTimer / this.shakeDuration;
      const intensity = this.shakeIntensity * t;

      baseShakeX = this.camera.position.x;
      baseShakeY = this.camera.position.y;
      baseShakeZ = this.camera.position.z;

      this.camera.position.x = baseShakeX + (Math.random() - 0.5) * intensity;
      this.camera.position.y = baseShakeY + (Math.random() - 0.5) * intensity * 0.5;
      this.camera.position.z = baseShakeZ + (Math.random() - 0.5) * intensity * 0.35;
      shakeApplied = true;

      if (this.shakeTimer <= 0) {
        this.shakeTimer = 0;
      }
    }

    // —— Render ——
    this.game.renderer.render(this.scene3d, this.camera);

    // Restore camera so shake offset never accumulates into movement/collision.
    if (shakeApplied) {
      this.camera.position.x = baseShakeX;
      this.camera.position.y = baseShakeY;
      this.camera.position.z = baseShakeZ;
    }
  }

  dispose() {
    this.controller.detach();
    this.controller.dispose();
    this.interaction.dispose();
    this.mudSplashTasks?.dispose();
    this.mudSplashTasks = null;
    this.tokenStationGroup = null;
    this.pauseController.dispose();
    hideMachinePreview();
    unmountShopHUD();
    unmountPauseUI();
    window.removeEventListener('resize', this.onResize);

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

  // ————————————————————————————————
  // Interaction Handlers
  // ————————————————————————————————

  private getContextualPrompt(type: string, defaultPrompt: string, object?: THREE.Object3D): string {
    const machineId = type === 'machine' && object ? getMachineId(object) : undefined;
    const machineState = machineId ? this.maintenance.getState(machineId) : undefined;

    return getShopContextualPrompt({
      type,
      defaultPrompt,
      machineId,
      machineState,
      tasks: this.tasks.getTasks(),
      hasCapsuleRefill: this.hasCapsuleRefill,
      hasTokenRefill: this.hasTokenRefill,
      canPullNow: this.economy.canPull(),
      tokenStationState: this.tokenStationState,
      hasAnyCapsuleRestockNeed: this.hasAnyCapsuleRestockNeed(),
      hasAnyTokenRestockNeed: this.hasAnyTokenRestockNeed(),
      wondertradeOwnedIds: this.collection.getDuplicateCandidates(),
      items: [...ITEMS],
    });
  }

  private getContextualActions(type: string, object?: THREE.Object3D): ShopPromptAction[] {
    const machineId = type === 'machine' && object ? getMachineId(object) : undefined;
    const machineState = machineId ? this.maintenance.getState(machineId) : undefined;

    return getShopContextualActions({
      type,
      defaultPrompt: '',
      machineId,
      machineState,
      tasks: this.tasks.getTasks(),
      hasCapsuleRefill: this.hasCapsuleRefill,
      hasTokenRefill: this.hasTokenRefill,
      canPullNow: machineId ? this.maintenance.canPull(machineId) : this.economy.canPull(),
      tokenStationState: this.tokenStationState,
      hasAnyCapsuleRestockNeed: this.hasAnyCapsuleRestockNeed(),
      hasAnyTokenRestockNeed: this.hasAnyTokenRestockNeed(),
      wondertradeOwnedIds: this.collection.getDuplicateCandidates(),
      items: [...ITEMS],
    });
  }

  private handleServiceInput(type: string, object: THREE.Object3D): boolean {
    if (type === 'storage-crate') {
      this.handleStorageCrate();
      return true;
    }
    
    if (type === 'token-crate') {
      this.handleTokenCrate();
      return true;
    }

    if (type === 'machine') {
      const machineId = getMachineId(object);
      if (!machineId) return false;

      // Service covers everything: clean, fix jam, restock, rewire
      if (this.tryCompleteNearbyTask(machineId, 'all')) {
        return true;
      }

      const state = this.maintenance.getState(machineId);
      if (!state) return false;

      // Manual fallbacks keep machines recoverable even when no explicit task is assigned.
      if (!state.isPowered && this.maintenance.rewire(machineId)) {
        const machineGroup = this.machineGroups.get(machineId);
        if (machineGroup) {
          triggerMachinePowerPulse(machineGroup);
        }
        showToast('Power restored', 1300);
        this.updateMachineTaskMarkers();
        this.updateHUD();
        return true;
      }

      if (state.isJammed && this.maintenance.fixJam(machineId)) {
        showToast('Machine jam cleared', 1300);
        this.maybeAwardJamServiceBonus(machineId);
        this.updateMachineTaskMarkers();
        this.updateHUD();
        return true;
      }

      if (state.cleanliness === 'dirty' && this.maintenance.cleanMachine(machineId)) {
        const machineGroup = this.machineGroups.get(machineId);
        if (machineGroup) {
          triggerMachineCleanPulse(machineGroup);
        }
        showToast('Machine glass cleaned', 1300);
        this.updateMachineTaskMarkers();
        this.updateHUD();
        return true;
      }

      if (state.stockLevel !== 'ok') {
        if (!this.hasCapsuleRefill) {
          showToast('Pick up capsules from the storage crate first', 1800);
          return true;
        }

        if (this.maintenance.restockMachine(machineId)) {
          const machineGroup = this.machineGroups.get(machineId);
          if (machineGroup) {
            restockMachineCapsules(machineGroup);
          }
          this.hasCapsuleRefill = false;
          showToast('Machine restocked', 1400);
          this.updateMachineTaskMarkers();
          this.updateHUD();
        }
        return true;
      }

      // If we got here, they hit R but machine has no problems
      showToast('Machine operating normally', 1300);
      return false;
    }

    if (type === 'token-station') {
      // Service covers everything: clean, fix jam, rewire, restock
      if (this.tryCompleteNearbyTask('token-station', 'all')) {
        return true;
      }

      // Manual fallbacks keep the terminal recoverable even when no explicit task is assigned.
      if (!this.tokenStationState.isPowered) {
        this.tokenStationState.isPowered = true;
        const pulse = this.tokenStationGroup?.userData['pulseGlow'] as (() => void) | undefined;
        pulse?.();
        this.updateTokenStationDisplay();
        this.updateMachineTaskMarkers();
        this.updateHUD();
        showToast('Terminal power restored', 1300);
        return true;
      }

      if (this.tokenStationState.isJammed) {
        this.tokenStationState.isJammed = false;
        const pulse = this.tokenStationGroup?.userData['pulseGlow'] as (() => void) | undefined;
        pulse?.();
        this.updateTokenStationDisplay();
        this.updateMachineTaskMarkers();
        this.updateHUD();
        showToast('Terminal jam cleared', 1300);
        return true;
      }

      if (this.tokenStationState.cleanliness === 'dirty') {
        this.tokenStationState.cleanliness = 'clean';
        const pulse = this.tokenStationGroup?.userData['pulseGlow'] as (() => void) | undefined;
        pulse?.();
        this.updateTokenStationDisplay();
        this.updateMachineTaskMarkers();
        this.updateHUD();
        showToast('Terminal screen cleaned', 1300);
        return true;
      }

      if (this.tokenStationState.stockLevel !== 'ok') {
        if (!this.hasTokenRefill) {
          showToast('Pick up token refill pack from token crate first', 1800);
          return true;
        }

        this.tokenStationState.stockLevel = 'ok';
        this.hasTokenRefill = false;
        const pulse = this.tokenStationGroup?.userData['pulseGlow'] as (() => void) | undefined;
        pulse?.();
        this.updateTokenStationDisplay();
        this.updateHUD();
        showToast('Terminal restocked', 1400);
        return true;
      }

      showToast('Terminal operating normally', 1300);
      return false;
    }

    return false;
  }

  private handleInteraction(type: string, object: THREE.Object3D) {
    switch (type) {
      case 'machine': {
        const machineId = getMachineId(object);
        if (!machineId) return;

        const state = this.maintenance.getState(machineId);
        if (!this.maintenance.canPull(machineId)) {
          showToast(
            getMachineOutOfOrderPrompt(state, this.hasCapsuleRefill) ?? ARCADE_STATUS_TEXT.outOfOrderServiceRequired,
            1800,
          );
          return;
        }

        this.handleMachinePull(object);
        break;
      }
      case 'token-station':
        if (!canUseTokenStation(this.tokenStationState)) {
          if (this.tokenStationState.stockLevel === 'empty') {
            showToast('Terminal empty - press R to service', 1500);
          } else {
            showToast('Terminal out of order - press R to service', 1500);
          }
          return;
        }

        this.handleTokenStation();
        break;
      case 'wondertrade':
        this.handleWondertrade();
        break;
      case 'secret':
        this.handleSecret(object);
        break;
      case 'shop-exit':
        this.endNight();
        break;
      case 'floor-spot':
        this.handleFloorSpotMop(object);
        break;
    }
  }

  private handleMachinePull(object: THREE.Object3D) {
    if (this.isPullInProgress) return;

    const machineId = getMachineId(object);
    if (!machineId) return;

    // Check if machine is available for pulling
    if (!this.maintenance.canPull(machineId)) {
      gameAudio.play('error');
      showToast(
        getMachineOutOfOrderPrompt(
          this.maintenance.getState(machineId),
          this.hasCapsuleRefill,
        ) ?? ARCADE_STATUS_TEXT.outOfOrderServiceRequired,
        1800,
      );
      return;
    }

    // Check tokens
    if (!this.economy.spendPull()) {
      gameAudio.play('error');
      showToast('Need tokens before pulling', 1400);
      return;
    }
    this.isPullInProgress = true;
    gameAudio.play('crank');
    
    // Fake crank anticipation UI: show "..." text on machine?
    showShopPrompt({ text: 'Cranking...', actions: [] });

    setTimeout(() => {
      hideShopPrompt();

      // Find machine definition
      const machineDef = MACHINES.find((m) => m.id === machineId);
      if (!machineDef) {
        this.isPullInProgress = false;
        return;
      }

      // Get maintenance state
      const machineState = this.maintenance.getState(machineId);

      // Pull!
      const result = this.capsule.pull(
        machineDef,
        machineState,
        this.time.getCurrentHour(),
      );

      if (!result) {
        this.isPullInProgress = false;
        return;
      }

      // Advance time
      this.time.advance(PULL_TIME_COST);

      // Duplicate detection
      const isDuplicate = this.collection.isDuplicate(result.item.id);

      // Add to collection (returns false if duplicate, but still track)
      this.collection.addItem(result.item.id);
      this.itemsObtainedThisNight.push(result.item.id);

      // Show reveal
      const accentColors: Record<string, string> = {
        common: '#aaaaaa',
        uncommon: '#44cc44',
        rare: '#4488ff',
        epic: '#cc44ff',
        legendary: '#ffcc00',
        mythical: '#ff72bd',
      };

      const isShiny = Math.random() < SHINY_PULL_CHANCE;
      const baseName = isDuplicate
        ? `${result.item.name} (DUPLICATE)`
        : result.item.name;
      const displayName = isShiny ? `★ Shiny ${baseName}` : baseName;
      const accentColor = isShiny
        ? SHINY_ACCENT_COLOR
        : accentColors[result.item.rarity] ?? '#7c6ef0';

      showPullResult(
        displayName,
        result.item.rarity,
        result.item.flavorText,
        accentColor,
        'KeyQ',
        () => {
          hidePullResult();
          this.isPullInProgress = false;
        }
      );
      gameAudio.play('reveal');

      // Screen shake — scales with rarity, bumped slightly when shiny.
      const shakeMap: Record<string, number> = {
        common: 0.01,
        uncommon: 0.015,
        rare: 0.025,
        epic: 0.04,
        legendary: 0.06,
        mythical: 0.075,
      };
      const shakeBase = shakeMap[result.item.rarity] ?? 0.01;
      this.triggerShake(isShiny ? shakeBase + 0.02 : shakeBase, 0.3);

      // Rare jackpot: a paid pull occasionally drops a second free capsule
      // from the same machine.
      if (Math.random() < JACKPOT_CAPSULE_CHANCE) {
        this.awardFreeCapsule(result.machineId, 'Jackpot capsule');
      }

      this.updateHUD();
    }, 1500);

  }

  /**
   * On a successful jam fix, roll a rare chance to drop a free bonus capsule
   * from the serviced machine's pool.
   */
  private maybeAwardJamServiceBonus(machineId: string): void {
    if (Math.random() >= JAM_SERVICE_BONUS_CAPSULE_CHANCE) return;
    this.awardFreeCapsule(machineId, 'Bonus capsule');
  }

  /**
   * Pull a free capsule from the given machine, add it to the collection, and
   * surface lightweight feedback (toast + reveal cue, no full overlay or
   * screen shake). Used by both the jam-service bonus and the post-pull
   * jackpot reward. Returns true if a capsule was actually awarded.
   */
  private awardFreeCapsule(machineId: string, label: string): boolean {
    const machineDef = MACHINES.find((m) => m.id === machineId);
    if (!machineDef) return false;

    const machineState = this.maintenance.getState(machineId);
    const result = this.capsule.pull(
      machineDef,
      machineState,
      this.time.getCurrentHour(),
    );
    if (!result) return false;

    this.collection.addItem(result.item.id);
    this.itemsObtainedThisNight.push(result.item.id);

    const isShiny = Math.random() < SHINY_PULL_CHANCE;
    const itemLabel = isShiny ? `★ Shiny ${result.item.name}` : result.item.name;

    gameAudio.play('reveal');
    showToast(`${label}: ${itemLabel}`, isShiny ? 2600 : 2200);
    return true;
  }

  private handleTokenStation() {
    if (!canUseTokenStation(this.tokenStationState)) {
      gameAudio.play('error');
      showToast(ARCADE_STATUS_TEXT.outOfOrderServiceRequired, 1800);
      return;
    }

    const pulse = this.tokenStationGroup?.userData['pulseGlow'] as (() => void) | undefined;
    pulse?.();
    updateTokenBalance(this.economy.getMoney());
    showTokenOverlay();
    this.controller.setEnabled(false);
  }

  private updateTokenStationDisplay() {
    const setStatus = this.tokenStationGroup?.userData['setStatus'] as
      | ((status: 'ready' | 'low_stock' | 'out_of_stock' | 'no_power' | 'jammed' | 'dirty') => void)
      | undefined;
    if (!setStatus) return;

    if (!this.tokenStationState.isPowered) {
      this.tokenStationState.isPowered = true;
    }
    if (this.tokenStationState.isJammed) {
      setStatus('jammed');
      return;
    }
    if (this.tokenStationState.stockLevel === 'empty') {
      setStatus('out_of_stock');
      return;
    }
    if (this.tokenStationState.stockLevel === 'low') {
      setStatus('low_stock');
      return;
    }
    if (this.tokenStationState.cleanliness === 'dirty') {
      setStatus('dirty');
      return;
    }

    setStatus('ready');
  }

  private getServiceState(targetId: string): MachineState | undefined {
    if (targetId === 'token-station') return this.tokenStationState;
    return this.maintenance.getState(targetId);
  }

  private handleStorageCrate() {
    if (!this.hasAnyCapsuleRestockNeed()) {
      gameAudio.play('error');
      showToast('No restock task pending right now', 1500);
      return;
    }

    if (this.hasCapsuleRefill) {
      gameAudio.play('error');
      showToast('Already carrying a refill canister', 1300);
      return;
    }

    this.hasCapsuleRefill = true;
    gameAudio.play('ui');
    showToast('Picked up refill canister from storage crate', 1600);
  }

  private handleTokenCrate() {
    if (!this.hasAnyTokenRestockNeed()) {
      gameAudio.play('error');
      showToast('Token station does not need refills right now', 1500);
      return;
    }

    if (this.hasTokenRefill) {
      gameAudio.play('error');
      showToast('Already carrying a token refill pack', 1300);
      return;
    }

    this.hasTokenRefill = true;
    gameAudio.play('ui');
    showToast('Picked up token refill pack', 1600);
  }

  private hasAnyCapsuleRestockNeed(): boolean {
    return hasAnyRestockNeedInWorld(
      this.hasPendingCapsuleRestockTask(),
      this.maintenance.getAllStates(),
    );
  }

  private hasAnyTokenRestockNeed(): boolean {
    return (
      this.hasPendingTokenRestockTask() ||
      this.tokenStationState.stockLevel === 'low' ||
      this.tokenStationState.stockLevel === 'empty'
    );
  }

  private hasPendingCapsuleRestockTask(): boolean {
    return this.tasks.getTasks().some((task) => {
      if (task.isCompleted) return false;
      if (task.targetId === 'token-station') return false;

      const template = TASK_TEMPLATES.find((t) => t.id === task.templateId);
      return template?.type === 'restock';
    });
  }

  private hasPendingTokenRestockTask(): boolean {
    return this.tasks.getTasks().some((task) => {
      if (task.isCompleted) return false;
      if (task.targetId !== 'token-station') return false;

      const template = TASK_TEMPLATES.find((t) => t.id === task.templateId);
      return template?.type === 'restock';
    });
  }

  private handleFloorSpotMop(object: THREE.Object3D) {
    const targetId = getTargetId(object);
    if (!targetId) return;

    if (targetId.startsWith('ambient-trash-spot-')) {
      if (object.userData[INTERACTION_KEYS.interactable] !== true) return;

      object.userData[INTERACTION_KEYS.interactable] = false;
      object.visible = false;

      const pickupReward = 2;
      const pickupTimeCost = 1;
      this.economy.earnMoney(pickupReward);
      this.moneyEarnedThisNight += pickupReward;
      this.time.advance(pickupTimeCost);
      gameAudio.play('ui');
      showToast(`Trash picked (${formatCurrencyDelta(pickupReward)})`, 1200);
      this.updateHUD();
      return;
    }

    if (!this.mudSplashTasks) return;

    const tasks = this.tasks.getTasks();
    const taskIndex = tasks.findIndex((task) => !task.isCompleted && task.targetId === targetId);
    if (taskIndex < 0) return;

    const task = tasks[taskIndex]!;
    const template = TASK_TEMPLATES.find((t) => t.id === task.templateId);
    if (!template || template.targetType !== 'floor') return;

    const mopResult = this.mudSplashTasks.mop(
      targetId,
      this.tasks.getTaskReward(task.templateId),
      this.tasks.getTaskTimeCost(task.templateId),
    );
    if (!mopResult) return;

    this.economy.earnMoney(mopResult.rewardGained);
    this.moneyEarnedThisNight += mopResult.rewardGained;
    this.time.advance(mopResult.timeCost);
    gameAudio.play(mopResult.isCompleted ? 'success' : 'ui');

    if (mopResult.isCompleted) {
      this.tasks.completeTask(taskIndex);
      const completionText = mopResult.kind === 'trash' ? 'Trash picked' : 'Mud cleaned';
      showToast(
        `${completionText} ${mopResult.hitsDone}/${mopResult.hitsRequired} (${formatCurrencyDelta(mopResult.rewardGained)})`,
        1400,
      );
      this.renderTasks();
    } else {
      const progressText = mopResult.kind === 'trash' ? 'Picking trash' : 'Scrubbing mud';
      showToast(
        `${progressText} ${mopResult.hitsDone}/${mopResult.hitsRequired} (${formatCurrencyDelta(mopResult.rewardGained)})`,
        1200,
      );
    }

    this.updateHUD();
  }

  private buyTokens(count: number) {
    if (!canUseTokenStation(this.tokenStationState)) {
      gameAudio.play('error');
      showToast(ARCADE_STATUS_TEXT.outOfOrderServiceRequired, 1800);
      this.updateTokenStationDisplay();
      return;
    }

    const bought = this.economy.buyTokens(count);
    if (bought > 0) {
      gameAudio.play('coin');
      // Rare jackpot: a successful purchase occasionally grants an extra token.
      if (Math.random() < JACKPOT_TOKEN_CHANCE) {
        this.economy.addTokens(JACKPOT_TOKEN_BONUS);
        showToast(
          `Jackpot! +${JACKPOT_TOKEN_BONUS} bonus token`,
          2000,
        );
      }
      this.updateHUD();
      updateTokenBalance(this.economy.getMoney());
    } else {
      gameAudio.play('error');
    }
  }

  // ————————————————————————————————
  // Task Completion
  // ————————————————————————————————

  /**
   * Attempt to complete a task relevant to the given machine.
   * Auto-completes when interacting near the machine target.
   * Returns true if a task was completed.
   */
  private tryCompleteNearbyTask(
    targetId?: string,
    restockMode: 'all' | 'exclude' | 'only' = 'all',
  ): boolean {
    if (!targetId) return false;

    const tasks = this.tasks.getTasks();
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i]!;
      if (task.isCompleted) continue;

      const template = TASK_TEMPLATES.find((t) => t.id === task.templateId);
      if (!template) continue;

      if (restockMode === 'only' && template.type !== 'restock') continue;
      if (restockMode === 'exclude' && template.type === 'restock') continue;

      let targetState: MachineState | undefined;
      if (template.targetType === 'machine') {
        targetState = this.getServiceState(targetId);
        if (!targetState) continue;

        const applicable =
          (template.type === 'wipe_glass' && targetState.cleanliness === 'dirty') ||
          (template.type === 'restock' && targetState.stockLevel !== 'ok') ||
          (template.type === 'fix_jam' && targetState.isJammed) ||
          (template.type === 'rewire' && !targetState.isPowered);

        if (!applicable) continue;
      }

      if (task.targetId !== targetId) continue;

      const isTokenStationTask = targetId === 'token-station';
      const hasRefill = isTokenStationTask ? this.hasTokenRefill : this.hasCapsuleRefill;
      if (template.type === 'restock' && !hasRefill) {
        // Missing refill should not block other pending machine tasks on the same target.
        continue;
      }

      // Exact targeted interaction required
      if (this.tasks.completeTask(i)) {
        const reward = this.tasks.getTaskReward(task.templateId);
        const timeCost = this.tasks.getTaskTimeCost(task.templateId);
        this.economy.earnMoney(reward);
        this.moneyEarnedThisNight += reward;
        this.time.advance(timeCost);
        gameAudio.play('success');
        showToast(`${formatCurrencyDelta(reward)} earned`, 1800);

        // Update maintenance state based on task
        if (template.targetType === 'machine') {
          const isTokenStation = targetId === 'token-station';
          if (template.type === 'wipe_glass') {
            if (isTokenStation) {
              this.tokenStationState.cleanliness = 'clean';
              const pulse = this.tokenStationGroup?.userData['pulseGlow'] as (() => void) | undefined;
              pulse?.();
            } else if (this.maintenance.cleanMachine(targetId)) {
              const machineGroup = this.machineGroups.get(targetId);
              if (machineGroup) {
                triggerMachineCleanPulse(machineGroup);
              }
            }
          } else if (template.type === 'restock') {
            if (isTokenStation) {
              this.tokenStationState.stockLevel = 'ok';
              this.hasTokenRefill = false;
              const pulse = this.tokenStationGroup?.userData['pulseGlow'] as (() => void) | undefined;
              pulse?.();
            } else if (this.maintenance.restockMachine(targetId)) {
              const machineGroup = this.machineGroups.get(targetId);
              if (machineGroup) {
                restockMachineCapsules(machineGroup);
              }
              this.hasCapsuleRefill = false;
            }
          } else if (template.type === 'fix_jam') {
            if (isTokenStation) {
              this.tokenStationState.isJammed = false;
              const pulse = this.tokenStationGroup?.userData['pulseGlow'] as (() => void) | undefined;
              pulse?.();
            } else {
              this.maintenance.fixJam(targetId);
            }
          } else if (template.type === 'rewire') {
            if (isTokenStation) {
              this.tokenStationState.isPowered = true;
              const pulse = this.tokenStationGroup?.userData['pulseGlow'] as (() => void) | undefined;
              pulse?.();
            } else if (this.maintenance.rewire(targetId)) {
              const machineGroup = this.machineGroups.get(targetId);
              if (machineGroup) {
                triggerMachinePowerPulse(machineGroup);
              }
            }
          }
        }

        this.renderTasks();
        this.updateMachineTaskMarkers();
        this.updateTokenStationDisplay();
        this.updateHUD();
        return true;
      }
    }
    return false;
  }

  // ————————————————————————————————
  // Wondertrade
  // ————————————————————————————————

  private handleWondertrade() {
    if (this.isPullInProgress) return;

    const owned = this.collection.getDuplicateCandidates();
    const status = getWondertradeStatus(owned, ITEMS);
    if (!status.canTrade) {
      gameAudio.play('error');
      if (status.reason === 'need-owned-items') {
        showToast('Need at least one collected item for Wonder Exchange', 1800);
      } else {
        showToast('Collection complete — no new Wonder Exchange rewards', 2000);
      }
      return;
    }

    const outcome = rollWondertradeOutcome(owned, ITEMS);
    if (!outcome) {
      gameAudio.play('error');
      showToast('Wonder Exchange unavailable right now', 1500);
      return;
    }

    this.isPullInProgress = true;
    gameAudio.play('crank');
    showShopPrompt({ text: 'Trading...', actions: [] });

    setTimeout(() => {
      hideShopPrompt();

      const { tradeAwayId, received } = outcome;

      // Remove the traded item conceptually (we don't actually remove from collection
      // since the CollectionSystem tracks unique ownership — just add the new one)
      this.collection.addItem(received.id);
      this.itemsObtainedThisNight.push(received.id);
      this.time.advance(PULL_TIME_COST);

      // Show reveal
      const accentColors: Record<string, string> = {
        common: '#aaaaaa',
        uncommon: '#44cc44',
        rare: '#4488ff',
        epic: '#cc44ff',
        legendary: '#ffcc00',
        mythical: '#ff72bd',
      };

      const tradeItem = getItemById(tradeAwayId);
      const tradeName = tradeItem ? tradeItem.name : 'an item';

      showPullResult(
        `${received.name}`,
        received.rarity,
        `Traded ${tradeName} → received ${received.name}!`,
        accentColors[received.rarity] ?? '#7c6ef0',
        'KeyQ',
        () => {
          hidePullResult();
          this.isPullInProgress = false;
        }
      );
      gameAudio.play('reveal');
      this.updateHUD();
    }, 1000);
  }

  // ————————————————————————————————
  // Secrets
  // ————————————————————————————————

  private handleSecret(object: THREE.Object3D) {
    const secretId = getSecretId(object);
    if (!secretId) return;

    // Only trigger once per session
    if (this.secretsTriggeredThisNight.includes(secretId)) return;

    if (this.progression.triggerSecret(secretId)) {
      this.secretsTriggeredThisNight.push(secretId);

      const secretName = getSecretName(object) ?? 'Something strange...';
      gameAudio.play('secret');
      showToast(`🔍 Secret discovered: ${secretName}`, 4000);

      // Bonus money for finding secrets
      this.economy.earnMoney(SECRET_DISCOVERY_BONUS);
      this.moneyEarnedThisNight += SECRET_DISCOVERY_BONUS;
      this.updateHUD();
    }
  }

  // ————————————————————————————————
  // Night End
  // ————————————————————————————————

  private endNight() {
    if (this.nightEnded) return;
    this.nightEnded = true;

    hideEndingSoon();

    const tasksCompleted = this.tasks.getCompletedCount();
    const tasksTotal = this.tasks.getTotalCount();

    // Complete night in progression
    this.progression.completeNight({
      night: this.progression.getCurrentNight() - 1,
      tasksCompleted,
      tasksTotal,
      moneyEarned: this.moneyEarnedThisNight,
      tokensSpent: 0,
      itemsObtained: this.itemsObtainedThisNight,
      secretsTriggered: this.secretsTriggeredThisNight,
    });

    gameAudio.play('nightEnd');
    this.openNightEndOverlay();
  }

  /** Build the current GameState from system state */
  private buildGameState(): GameState {
    return buildShopReturnGameState({
      nightsWorked: this.progression.getNightsWorked(),
      money: this.economy.getMoney(),
      totalMoneyEarnedBeforeNight: this.totalMoneyEarnedBeforeNight,
      moneyEarnedThisNight: this.moneyEarnedThisNight,
      tokens: this.economy.getTokens(),
      ownedItemIds: this.collection.getOwnedItemIds(),
      secretsTriggered: this.progression.getSecretsTriggered(),
      existingSettings: loadGameState()?.settings,
    });
  }

  private async returnHome() {
    if (this.isReturningHome) return;
    this.isReturningHome = true;
    this.closeMachineDropPreview(false);

    this.controller.setEnabled(false);

    // Save game state
    const gameState = this.buildGameState();
    saveGameState(gameState);

    // Fade out
    const fade = document.createElement('div');
    fade.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: #000; z-index: 50; opacity: 0;
      transition: opacity 0.6s ease;
    `;
    document.body.appendChild(fade);
    requestAnimationFrame(() => {
      fade.style.opacity = '1';
    });

    await new Promise((r) => setTimeout(r, 700));

    // Transition back to bedroom with updated state
    await getSceneRouter().toBedroom(this.game, gameState, { showStartGateOnLoad: false });
    fade.remove();
  }

  private dismissNightEndOverlay() {
    if (!isNightEndVisible()) return;
    hideNightEndOverlay();
    this.controller.setEnabled(true);
    requestPointerLockSafely(this.game.canvas);
    showToast('Night complete. Look at the door and press E to reopen the return menu.', 1800);
  }

  private openNightEndOverlay() {
    this.closeMachineDropPreview(false);
    showNightEndOverlay(buildNightEndSummary(
      this.itemsObtainedThisNight,
      this.tasks.getCompletedCount(),
      this.tasks.getTotalCount(),
      this.moneyEarnedThisNight,
    ));
    // Release pointer lock so summary buttons are clickable.
    this.controller.resumeWithFreeCursor();
    if (document.pointerLockElement === this.game.canvas) {
      document.exitPointerLock();
    }
  }

  // ————————————————————————————————
  // HUD Updates
  // ————————————————————————————————

  private openPauseMenu() {
    if (isPauseMenuVisible()) return;
    if (this.pauseController.isClickToStartVisible()) return;
    this.closeMachineDropPreview(false);
    this.pauseController.openPauseMenu();
  }

  private toggleMachineDropPreview(machineId: string) {
    if (isMachinePreviewVisible() && this.previewMachineId === machineId) {
      this.closeMachineDropPreview();
      return;
    }

    this.openMachineDropPreview(machineId);
  }

  private openMachineDropPreview(machineId: string) {
    const machineDef = this.availableMachines.find((machine) => machine.id === machineId);
    if (!machineDef) return;

    const rarityOrder: Array<keyof MachineDefinition['rarityWeights']> = [
      'common',
      'uncommon',
      'rare',
      'epic',
      'legendary',
      'mythical',
    ];

    const totalWeight = rarityOrder.reduce((sum, rarity) => {
      return sum + (machineDef.rarityWeights[rarity] ?? 0);
    }, 0);
    if (totalWeight <= 0) return;

    const rarityRows = rarityOrder
      .filter((rarity) => (machineDef.rarityWeights[rarity] ?? 0) > 0)
      .map((rarity) => {
        const weight = machineDef.rarityWeights[rarity] ?? 0;
        const chancePct = `${((weight / totalWeight) * 100).toFixed(1)}%`;
        const itemNames = machineDef.itemPoolIds
          .map((itemId) => getItemById(itemId))
          .filter((item) => item?.rarity === rarity)
          .map((item) => item!.name);
        return { rarity, weight, chancePct, itemNames };
      });

    showMachinePreview({
      machineName: machineDef.name,
      rarityRows,
    });
    hideShopPrompt();
    this.previewMachineId = machineId;
    this.controller.setEnabled(false);
    if (document.pointerLockElement === this.game.canvas) {
      document.exitPointerLock();
    }
  }

  private closeMachineDropPreview(relock = true) {
    if (!isMachinePreviewVisible()) return;
    hideMachinePreview();
    this.previewMachineId = null;
    this.controller.setEnabled(true);
    if (relock) {
      requestPointerLockSafely(this.game.canvas);
    }
  }

  private updateMachineTaskMarkers() {
    updateShopTaskMarkers({
      machineGroups: this.machineGroups,
      tokenStationGroup: this.tokenStationGroup,
      tasks: this.tasks.getTasks(),
    });
  }

  private updateHUD() {
    this.hudPresenter.syncHud(
      this.economy.getMoney(),
      this.economy.getTokens(),
      this.time.getFormattedTime(),
      this.time.getNightProgress(),
    );
  }

  private renderTasks() {
    this.hudPresenter.renderTasks(this.tasks.getTasks(), this.availableMachines);
  }

  // ————————————————————————————————
  // Collision
  // ————————————————————————————————

  private clampPosition() {
    clampShopPosition(this.camera.position, this.colliders);
  }

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  };

  // ————————————————————————————————
  // Screen Shake
  // ————————————————————————————————

  private triggerShake(intensity: number, duration: number) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }
}
