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
import type { Scene, MachineDefinition } from '../data/types.js';
import type { Game } from '../core/Game.js';
import { FirstPersonController } from '../core/FirstPersonController.js';
import { InteractionSystem } from '../core/InteractionSystem.js';
import { PLAYER_HEIGHT, PULL_TIME_COST, DEFAULT_SETTINGS } from '../core/Config.js';
import { saveGameState } from '../core/Save.js';
import type { GameState } from '../data/types.js';

// Systems
import { TimeSystem } from '../systems/TimeSystem.js';
import { TaskSystem } from '../systems/TaskSystem.js';
import { MaintenanceSystem } from '../systems/MaintenanceSystem.js';
import { EconomySystem } from '../systems/EconomySystem.js';
import { CapsuleSystem } from '../systems/CapsuleSystem.js';
import { CollectionSystem } from '../systems/CollectionSystem.js';
import { ProgressionSystem } from '../systems/ProgressionSystem.js';

// Data
import { MACHINES, getAvailableMachines } from '../data/machines.js';
import { TASK_TEMPLATES } from '../data/tasks.js';
import { getItemById, ITEMS } from '../data/items.js';

// World
import { buildShopFloor } from '../world/ShopFloor.js';

// UI
import {
  mountShopHUD,
  unmountShopHUD,
  updateClock,
  updateTimeBar,
  updateMoney,
  updateTokens,
  updateTokenBalance,
  renderTaskList,
  showShopPrompt,
  hideShopPrompt,
  showPullResult,
  hidePullResult,
  isPullResultVisible,
  showTokenOverlay,
  hideTokenOverlay,
  isTokenOverlayVisible,
  showNightEndOverlay,
  isNightEndVisible,
  showEndingSoon,
  hideEndingSoon,
  showToast,
} from '../ui/shopHUD.js';
import {
  mountPauseUI,
  unmountPauseUI,
  showPauseMenu,
  hidePauseMenu,
  isPauseMenuVisible,
} from '../ui/pauseUI.js';

// Bounds
const SHOP_HALF_W = 6.5;
const SHOP_HALF_D = 5.5;

export class ShopScene implements Scene {
  private game: Game;
  private scene3d: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controller: FirstPersonController;
  private interaction: InteractionSystem;

  // Systems
  private time: TimeSystem;
  private tasks: TaskSystem;
  private maintenance: MaintenanceSystem;
  private economy: EconomySystem;
  private capsule: CapsuleSystem;
  private collection: CollectionSystem;
  private progression: ProgressionSystem;

  // State
  private machineGroups = new Map<string, THREE.Group>();
  private availableMachines: MachineDefinition[] = [];
  private moneyEarnedThisNight = 0;
  private itemsObtainedThisNight: string[] = [];
  private nightEnded = false;
  private endingSoonShown = false;
  private witchingHourShown = false;
  private secretsTriggeredThisNight: string[] = [];

  // Screen shake
  private shakeIntensity = 0;
  private shakeDuration = 0;
  private shakeTimer = 0;

  constructor(
    game: Game,
    economy?: EconomySystem,
    collection?: CollectionSystem,
    progression?: ProgressionSystem,
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
    this.interaction = new InteractionSystem();

    // Systems — use passed-in or create fresh
    this.economy = economy ?? new EconomySystem(200, 2);
    this.collection = collection ?? new CollectionSystem();
    this.progression = progression ?? new ProgressionSystem();
    this.time = new TimeSystem();
    this.tasks = new TaskSystem();
    this.maintenance = new MaintenanceSystem();
    this.capsule = new CapsuleSystem();
  }

  init() {
    // —— Get progression data for this night ——
    const prog = this.progression.getCurrentProgression();
    const nightsWorked = this.progression.getNightsWorked();

    // Available machines based on progression
    this.availableMachines = getAvailableMachines(nightsWorked);

    // —— Initialize maintenance states ——
    const machineIds = this.availableMachines.map((m) => m.id);
    this.maintenance.initializeForNight(machineIds, prog.difficultyModifier);

    // —— Generate tasks ——
    const [minTasks, maxTasks] = prog.taskCount;
    const taskCount =
      minTasks + Math.floor(Math.random() * (maxTasks - minTasks + 1));
    this.tasks.generateTasks(taskCount, machineIds);

    // —— Build shop floor ——
    const stateMap = new Map<string, import('../data/types.js').MachineState>();
    for (const id of machineIds) {
      const st = this.maintenance.getState(id);
      if (st) stateMap.set(id, st);
    }

    const { group, interactables, machineGroups } = buildShopFloor(
      this.availableMachines,
      stateMap,
    );
    this.machineGroups = machineGroups;
    this.scene3d.add(group);

    // —— Spawn Task Targets (Floor Spots) ——
    const spotGeo = new THREE.PlaneGeometry(0.6, 0.6);
    // Dark translucent puddle to represent a dirty floor spot
    const spotMat = new THREE.MeshStandardMaterial({
      color: 0x111115,
      roughness: 0.1, // Shiny liquid
      transparent: true,
      opacity: 0.75,
      depthWrite: false, // Prevents Z-fighting
    });

    const activeTasks = this.tasks.getTasks();
    activeTasks.forEach((task) => {
      const template = TASK_TEMPLATES.find((t) => t.id === task.templateId);
      if (template?.targetType === 'floor') {
        const spot = new THREE.Mesh(spotGeo, spotMat);
        // Random placement near the center aisle
        const rx = (Math.random() - 0.5) * 6; // Avoid walls
        const rz = (Math.random() - 0.5) * 4;
        spot.position.set(rx, 0.01, rz);
        spot.rotation.x = -Math.PI / 2;
        spot.name = task.targetId;

        spot.userData['interactable'] = true;
        spot.userData['interactType'] = 'floor-spot';
        spot.userData['prompt'] = 'Mop floor';
        spot.userData['targetId'] = task.targetId;

        this.scene3d.add(spot);
        interactables.push(spot);
      }
    });

    // —— Register interactables ——
    this.interaction.setInteractables(interactables);

    // —— Camera ——
    this.camera.position.set(0, PLAYER_HEIGHT, 4);
    this.controller.attach(this.camera);

    // —— Mount HUD ——
    mountShopHUD();
    mountPauseUI();
    this.updateHUD();
    this.renderTasks();

    // —— Pause Logic ——
    this.controller.onPause = () => {
      this.game.isPaused = true;
      showPauseMenu(() => {
        // Resume callback
        hidePauseMenu();
        this.game.isPaused = false;
        // re-request pointer lock
        this.game.canvas.requestPointerLock();
      });
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
      this.game.canvas.requestPointerLock();
    });

    // —— Wire night continue button ——
    document.getElementById('night-continue')?.addEventListener('click', () => {
      this.returnHome();
    });

    // —— Resize ——
    window.addEventListener('resize', this.onResize);
  }

  update(dt: number) {
    const input = this.game.input;

    // —— Pause Menu Toggle ——
    if (isPauseMenuVisible()) {
      if (input.isMenuPressed()) {
        hidePauseMenu();
        this.game.isPaused = false;
        this.game.canvas.requestPointerLock();
      }
      this.game.renderer.render(this.scene3d, this.camera);
      return;
    }

    // —— Night end overlay active ——
    if (isNightEndVisible()) {
      this.controller.setEnabled(false);
      this.game.renderer.render(this.scene3d, this.camera);
      return;
    }

    // —— Pull result displayed ——
    if (isPullResultVisible()) {
      // The event listener inside shopHUD.ts handles the dismissal now.
      // We just pause update processing while the reveal is open.
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

    // —— Time system ——
    if (!this.nightEnded) {
      this.time.advanceRealTime(dt);
      updateClock(this.time.getFormattedTime());
      updateTimeBar(this.time.getNightProgress());

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

    // —— Machine Polish Animations (M15) ——
    const timeNow = performance.now() * 0.001;
    this.machineGroups.forEach((mGroup, id) => {
      const state = this.maintenance.getState(id);
      if (mGroup.userData['animate']) {
        mGroup.userData['animate'](timeNow, state);
      }
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

    if (target && !this.nightEnded) {
      // Build contextual prompt
      const prompt = this.getContextualPrompt(target.type, target.prompt);
      showShopPrompt(prompt);

      if (input.isInteractPressed()) {
        this.handleInteraction(target.type, target.object);
      }
    } else {
      hideShopPrompt();
    }

    // —— Screen shake ——
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const t = this.shakeTimer / this.shakeDuration;
      const intensity = this.shakeIntensity * t;
      this.camera.position.x += (Math.random() - 0.5) * intensity;
      this.camera.position.y += (Math.random() - 0.5) * intensity * 0.5 + PLAYER_HEIGHT;
      if (this.shakeTimer <= 0) {
        this.shakeTimer = 0;
      }
    }

    // —— Render ——
    this.game.renderer.render(this.scene3d, this.camera);
  }

  dispose() {
    this.controller.detach();
    this.controller.dispose();
    this.interaction.dispose();
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

  private getContextualPrompt(type: string, defaultPrompt: string): string {
    if (type === 'machine') {
      if (!this.economy.canPull()) return `${defaultPrompt} (need tokens)`;
      return `Pull — ${defaultPrompt}`;
    }
    if (type === 'token-station') return 'Buy Tokens';
    if (type === 'shop-exit') return 'End Shift';
    if (type === 'wondertrade') {
      const dupes = this.collection.getOwnedItemIds().length;
      return dupes > 0 ? 'Wonder Exchange' : 'Wonder Exchange (need items)';
    }
    return defaultPrompt;
  }

  private handleInteraction(type: string, object: THREE.Object3D) {
    switch (type) {
      case 'machine':
        if (this.tryCompleteNearbyTask(object.userData['machineId'] as string)) {
          return; // Completed a task
        }
        this.handleMachinePull(object);
        break;
      case 'floor-spot':
        if (this.tryCompleteNearbyTask(object.userData['targetId'] as string)) {
          object.visible = false; // Hide cleaned spot
        }
        break;
      case 'token-station':
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
    }
  }

  private handleMachinePull(object: THREE.Object3D) {
    const machineId = object.userData['machineId'] as string;
    if (!machineId) return;

    // Check if machine is available for pulling
    if (!this.maintenance.canPull(machineId)) {
      // Show issue info via prompt (user needs to complete relevant task)
      return;
    }

    // Check tokens
    if (!this.economy.spendPull()) return;

    // We disable controller immediately so player can't look away during the crank sequence
    this.controller.setEnabled(false);

    // Audio sequence for anticipation (M14)
    // Here we trigger the Howler global sound for a gacha capsule crank...
    // (Assuming sounds are placed globally or just use a placeholder toast/visual lag)
    
    // Fake crank anticipation UI: show "..." text on machine?
    showShopPrompt(`Cranking...`);

    setTimeout(() => {
      hideShopPrompt();

      // Find machine definition
      const machineDef = MACHINES.find((m) => m.id === machineId);
      if (!machineDef) return;

      // Get maintenance state
      const machineState = this.maintenance.getState(machineId);

      // Pull!
      const result = this.capsule.pull(
        machineDef,
        machineState,
        this.time.getCurrentHour(),
      );

      if (!result) {
        this.controller.setEnabled(true);
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
      };

      const displayName = isDuplicate
        ? `${result.item.name} (DUPLICATE)`
        : result.item.name;

      showPullResult(
        displayName,
        result.item.rarity,
        result.item.flavorText,
        accentColors[result.item.rarity] ?? '#7c6ef0',
        () => {
          hidePullResult();
          this.controller.setEnabled(true);
          this.game.canvas.requestPointerLock();
        }
      );

      // Screen shake — scales with rarity
      const shakeMap: Record<string, number> = {
        common: 0.01,
        uncommon: 0.015,
        rare: 0.025,
        epic: 0.04,
        legendary: 0.06,
      };
      this.triggerShake(shakeMap[result.item.rarity] ?? 0.01, 0.3);

      this.updateHUD();
    }, 1500);

  }

  private handleTokenStation() {
    updateTokenBalance(this.economy.getMoney());
    showTokenOverlay();
    this.controller.setEnabled(false);
  }

  private buyTokens(count: number) {
    const bought = this.economy.buyTokens(count);
    if (bought > 0) {
      this.updateHUD();
      updateTokenBalance(this.economy.getMoney());
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
  private tryCompleteNearbyTask(targetId?: string): boolean {
    if (!targetId) return false;

    const tasks = this.tasks.getTasks();
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i]!;
      if (task.isCompleted) continue;

      const template = TASK_TEMPLATES.find((t) => t.id === task.templateId);
      if (!template) continue;

      // Exact targeted interaction required
      if (task.targetId === targetId && this.tasks.completeTask(i)) {
        const reward = this.tasks.getTaskReward(task.templateId);
        const timeCost = this.tasks.getTaskTimeCost(task.templateId);
        this.economy.earnMoney(reward);
        this.moneyEarnedThisNight += reward;
        this.time.advance(timeCost);

        // Update maintenance state based on task
        if (template.targetType === 'machine') {
          if (template.type === 'wipe_glass') {
            this.maintenance.cleanMachine(targetId);
          } else if (template.type === 'restock') {
            this.maintenance.restockMachine(targetId);
          } else if (template.type === 'fix_jam') {
            this.maintenance.fixJam(targetId);
          } else if (template.type === 'rewire') {
            this.maintenance.rewire(targetId);
          }
        }

        this.renderTasks();
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
    // Need at least 1 item owned
    const owned = this.collection.getOwnedItemIds();
    if (owned.length === 0) return;

    // Pick a random owned item to trade away (player doesn't choose for simplicity)
    const tradeAwayId = owned[Math.floor(Math.random() * owned.length)]!;

    // Pick a random item NOT in collection from all items
    const unowned = ITEMS.filter((item) => !this.collection.hasItem(item.id));
    if (unowned.length === 0) return; // Player has everything!

    // Disable controller immediately to capture state and prevent movement loop issues
    this.controller.setEnabled(false);
    showShopPrompt('Trading...');

    setTimeout(() => {
      hideShopPrompt();

      const received = unowned[Math.floor(Math.random() * unowned.length)]!;

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
      };

      const tradeItem = getItemById(tradeAwayId);
      const tradeName = tradeItem ? tradeItem.name : 'an item';

      showPullResult(
        `${received.name}`,
        received.rarity,
        `Traded ${tradeName} → received ${received.name}!`,
        accentColors[received.rarity] ?? '#7c6ef0',
        () => {
          hidePullResult();
          this.controller.setEnabled(true);
          this.game.canvas.requestPointerLock();
        }
      );
      this.updateHUD();
    }, 1000);
  }

  // ————————————————————————————————
  // Secrets
  // ————————————————————————————————

  private handleSecret(object: THREE.Object3D) {
    const secretId = object.userData['secretId'] as string;
    if (!secretId) return;

    // Only trigger once per session
    if (this.secretsTriggeredThisNight.includes(secretId)) return;

    if (this.progression.triggerSecret(secretId)) {
      this.secretsTriggeredThisNight.push(secretId);

      const secretName = object.userData['secretName'] as string ?? 'Something strange...';
      showToast(`🔍 Secret discovered: ${secretName}`, 4000);

      // Bonus money for finding secrets
      this.economy.earnMoney(50);
      this.moneyEarnedThisNight += 50;
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
    this.controller.setEnabled(false);

    // Complete night in progression
    this.progression.completeNight({
      night: this.progression.getCurrentNight() - 1,
      tasksCompleted: this.tasks.getCompletedCount(),
      tasksTotal: this.tasks.getTotalCount(),
      moneyEarned: this.moneyEarnedThisNight,
      tokensSpent: 0,
      itemsObtained: this.itemsObtainedThisNight,
      secretsTriggered: this.secretsTriggeredThisNight,
    });

    // Resolve item details for display
    const itemDetails = this.itemsObtainedThisNight
      .map((id) => getItemById(id))
      .filter((item): item is NonNullable<typeof item> => item != null)
      .map((item) => ({ name: item.name, rarity: item.rarity }));

    showNightEndOverlay({
      tasksCompleted: this.tasks.getCompletedCount(),
      tasksTotal: this.tasks.getTotalCount(),
      moneyEarned: this.moneyEarnedThisNight,
      itemsObtained: itemDetails,
    });
  }

  /** Build the current GameState from system state */
  private buildGameState(): GameState {
    return {
      version: 1,
      nightsWorked: this.progression.getNightsWorked(),
      money: this.economy.getMoney(),
      tokens: this.economy.getTokens(),
      ownedItemIds: this.collection.getOwnedItemIds(),
      secretsTriggered: this.progression.getSecretsTriggered(),
      settings: { ...DEFAULT_SETTINGS },
    };
  }

  private async returnHome() {
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
    const { BedroomScene } = await import('./BedroomScene.js');
    await this.game.sceneManager.switchTo(new BedroomScene(this.game, gameState));
    fade.remove();
  }

  // ————————————————————————————————
  // HUD Updates
  // ————————————————————————————————

  private updateHUD() {
    updateMoney(this.economy.getMoney());
    updateTokens(this.economy.getTokens());
    updateClock(this.time.getFormattedTime());
    updateTimeBar(this.time.getNightProgress());
  }

  private renderTasks() {
    const tasks = this.tasks.getTasks();
    const taskData = tasks.map((t) => {
      const template = TASK_TEMPLATES.find((tt) => tt.id === t.templateId);
      return {
        description: template?.description ?? 'Unknown task',
        isCompleted: t.isCompleted,
      };
    });
    renderTaskList(taskData);
  }

  // ————————————————————————————————
  // Collision
  // ————————————————————————————————

  private clampPosition() {
    const pos = this.camera.position;
    const playerRadius = 0.5;

    // Outer walls check
    pos.x = Math.max(-SHOP_HALF_W + playerRadius, Math.min(SHOP_HALF_W - playerRadius, pos.x));
    pos.z = Math.max(-SHOP_HALF_D + playerRadius, Math.min(SHOP_HALF_D - playerRadius, pos.z));
    pos.y = PLAYER_HEIGHT;

    // Inner collision against capsule machines using simple AABB
    // Machine width ~0.85, depth ~0.75
    const mw = 0.85 / 2 + playerRadius;
    const md = 0.75 / 2 + playerRadius;

    for (const machine of this.availableMachines) {
      const mx = machine.position[0];
      const mz = machine.position[2];
      // Machine might be rotated, but for simplicity we'll just check a slightly padded square AABB
      // Since rotation in shop is typically multiples of PI/2
      const isRotated = Math.abs(machine.rotation) % Math.PI > 0.01;
      const boundX = isRotated ? md : mw;
      const boundZ = isRotated ? mw : md;

      const dx = pos.x - mx;
      const dz = pos.z - mz;

      if (Math.abs(dx) < boundX && Math.abs(dz) < boundZ) {
        // Resolve collision by pushing out along the axis of shallowest penetration
        const overlapX = boundX - Math.abs(dx);
        const overlapZ = boundZ - Math.abs(dz);

        if (overlapX < overlapZ) {
          pos.x += Math.sign(dx) * overlapX;
        } else {
          pos.z += Math.sign(dz) * overlapZ;
        }
      }
    }
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
