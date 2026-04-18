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
} from '../ui/shopHUD.js';

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
  private availableMachines: MachineDefinition[] = [];
  private moneyEarnedThisNight = 0;
  private itemsObtainedThisNight: string[] = [];
  private nightEnded = false;
  private endingSoonShown = false;

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

    const { group, interactables } = buildShopFloor(
      this.availableMachines,
      stateMap,
    );
    this.scene3d.add(group);

    // —— Register interactables ——
    this.interaction.setInteractables(interactables);

    // —— Camera ——
    this.camera.position.set(0, PLAYER_HEIGHT, 4);
    this.controller.attach(this.camera);

    // —— Mount HUD ——
    mountShopHUD();
    this.updateHUD();
    this.renderTasks();

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

    // —— Night end overlay active ——
    if (isNightEndVisible()) {
      this.controller.setEnabled(false);
      this.game.renderer.render(this.scene3d, this.camera);
      return;
    }

    // —— Pull result displayed ——
    if (isPullResultVisible()) {
      this.controller.setEnabled(false);
      // Any key/click to dismiss
      if (input.isInteractPressed() || input.isMenuPressed()) {
        hidePullResult();
        this.controller.setEnabled(true);
      }
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
    }

    // —— Movement ——
    if (!this.controller.isEnabled()) {
      this.controller.setEnabled(true);
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

    // —— Render ——
    this.game.renderer.render(this.scene3d, this.camera);
  }

  dispose() {
    this.controller.detach();
    this.controller.dispose();
    this.interaction.dispose();
    unmountShopHUD();
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
        // Try task completion first, then pull
        if (this.tryCompleteNearbyTask(object.userData['machineId'] as string)) {
          return; // Completed a task
        }
        this.handleMachinePull(object);
        break;
      case 'token-station':
        this.handleTokenStation();
        break;
      case 'wondertrade':
        this.handleWondertrade();
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

    if (!result) return;

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
    );

    this.controller.setEnabled(false);
    this.updateHUD();
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
  private tryCompleteNearbyTask(machineId?: string): boolean {
    const tasks = this.tasks.getTasks();
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i]!;
      if (task.isCompleted) continue;

      const template = TASK_TEMPLATES.find((t) => t.id === task.templateId);
      if (!template) continue;

      // Match: floor tasks complete near any machine, machine tasks match target
      const isMatch =
        template.targetType === 'floor' ||
        (template.targetType === 'machine' && task.targetId === machineId);

      if (isMatch && this.tasks.completeTask(i)) {
        const reward = this.tasks.getTaskReward(task.templateId);
        const timeCost = this.tasks.getTaskTimeCost(task.templateId);
        this.economy.earnMoney(reward);
        this.moneyEarnedThisNight += reward;
        this.time.advance(timeCost);

        // Update maintenance state based on task
        if (machineId) {
          if (template.type === 'wipe_glass') {
            this.maintenance.cleanMachine(machineId);
          } else if (template.type === 'restock') {
            this.maintenance.restockMachine(machineId);
          } else if (template.type === 'fix_jam') {
            this.maintenance.fixJam(machineId);
          } else if (template.type === 'rewire') {
            this.maintenance.rewire(machineId);
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
    );

    this.controller.setEnabled(false);
    this.updateHUD();
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
      secretsTriggered: [],
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
    pos.x = Math.max(-SHOP_HALF_W, Math.min(SHOP_HALF_W, pos.x));
    pos.z = Math.max(-SHOP_HALF_D, Math.min(SHOP_HALF_D, pos.z));
    pos.y = PLAYER_HEIGHT;
  }

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  };
}
