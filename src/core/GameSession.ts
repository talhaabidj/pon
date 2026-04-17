/**
 * Owns save-backed gameplay systems and exposes high-level actions to scenes.
 */
import { ITEMS } from '../data/items';
import { getMachineById } from '../data/machines';
import { SETS } from '../data/sets';
import { CapsuleSystem, type CapsulePullResult } from '../systems/CapsuleSystem';
import { CollectionSystem } from '../systems/CollectionSystem';
import { EconomySystem, type ConversionResult } from '../systems/EconomySystem';
import { MaintenanceSystem } from '../systems/MaintenanceSystem';
import { ProgressionSystem } from '../systems/ProgressionSystem';
import { TaskSystem, type TaskInstance } from '../systems/TaskSystem';
import { TimeSystem } from '../systems/TimeSystem';
import { DEFAULT_SAVE_DATA, SaveSystem, type SaveData, type SaveSettings } from './Save';

export interface NightReport {
  readonly night: number;
  readonly tasksCompleted: number;
  readonly tasksTotal: number;
  readonly wagesEarned: number;
  readonly tokensSpent: number;
  readonly itemsGained: readonly CapsulePullResult[];
  readonly completedSetNames: readonly string[];
  readonly secrets: readonly string[];
  readonly endedAt: string;
}

export interface SessionSnapshot {
  readonly save: SaveData;
  readonly night: number;
  readonly clock: string;
  readonly tasks: readonly TaskInstance[];
  readonly money: number;
  readonly tokens: number;
  readonly lifetimeMoney: number;
  readonly lifetimeTokensUsed: number;
  readonly collectedCount: number;
  readonly totalItems: number;
  readonly completedSets: number;
  readonly totalSets: number;
  readonly unlockedMachineIds: readonly string[];
}

export class GameSession {
  public readonly saveSystem = new SaveSystem();
  public readonly capsuleSystem = new CapsuleSystem();
  public readonly progressionSystem = new ProgressionSystem();
  public collectionSystem: CollectionSystem;
  public economySystem: EconomySystem;
  public maintenanceSystem: MaintenanceSystem;
  public taskSystem: TaskSystem;
  public timeSystem: TimeSystem;
  private saveData: SaveData;
  private currentReport: NightReport;
  private pullCount = 0;

  public constructor() {
    this.saveData = this.loadSafe();
    this.collectionSystem = new CollectionSystem(this.saveData.collectedItemIds);
    this.economySystem = new EconomySystem(
      this.saveData.money,
      this.saveData.tokens,
      this.saveData.lifetimeMoney,
      this.saveData.lifetimeTokensUsed,
    );
    this.maintenanceSystem = new MaintenanceSystem(this.saveData.machineStates);
    this.taskSystem = new TaskSystem();
    this.timeSystem = new TimeSystem();
    this.currentReport = this.createEmptyReport();
  }

  public beginNight(): void {
    this.timeSystem = new TimeSystem();
    this.taskSystem = new TaskSystem();
    this.pullCount = 0;

    const config = this.progressionSystem.getNightConfig(this.saveData.night);
    const tasks = this.taskSystem.generateNightTasks(
      this.saveData.night,
      config.unlockedMachineIds,
      config.taskCount,
      `night-${this.saveData.night}`,
    );

    this.maintenanceSystem = new MaintenanceSystem(this.taskSystem.getProblemStates());
    this.currentReport = this.createEmptyReport();
    this.addShiftLog(`Night ${this.saveData.night}: ${config.note}`);

    if (config.hiddenMachineUnlocked && !this.saveData.flags.hiddenMachineFound) {
      this.updateFlags({ hiddenMachineFound: true });
      this.currentReport = {
        ...this.currentReport,
        secrets: ['A staff-only machine clicked awake behind the shelf.'],
      };
    }

    if (tasks.length > 0) {
      this.persist();
    }
  }

  public completeTask(taskId: string): TaskInstance {
    const task = this.taskSystem.completeTask(taskId);
    this.maintenanceSystem.completeTaskProblem(task.targetMachineId, task.problemState);
    this.economySystem.addWages(task.reward);
    this.timeSystem.advanceMinutes(task.minutes);
    this.currentReport = {
      ...this.currentReport,
      tasksCompleted: this.taskSystem.getCompletedCount(),
      tasksTotal: this.taskSystem.getTotalCount(),
      wagesEarned: this.currentReport.wagesEarned + task.reward,
    };

    if (
      task.type === 'fix_jam' &&
      task.targetMachineId === 'machine-midnight-trains' &&
      this.timeSystem.isWithinWindow('02:45', '03:20') &&
      !this.saveData.flags.ghostlineHintSeen
    ) {
      this.updateFlags({ ghostlineHintSeen: true });
      this.currentReport = {
        ...this.currentReport,
        secrets: [
          ...this.currentReport.secrets,
          'Machine 04 hummed at 03:07 after the jam cleared.',
        ],
      };
    }

    this.persist();
    return task;
  }

  public convertAllMoneyToTokens(): ConversionResult {
    const result = this.economySystem.convertMoneyToTokens();
    this.persist();
    return result;
  }

  public pullCapsule(machineId: string): CapsulePullResult {
    const machine = getMachineById(machineId);
    if (!this.economySystem.spendTokens(machine.tokenCost)) {
      throw new Error(`Not enough tokens for ${machine.displayName}`);
    }

    const seed = `night-${this.saveData.night}:pull-${this.pullCount}:${machineId}:${this.timeSystem.getClock()}`;
    this.pullCount += 1;
    const result = this.capsuleSystem.pull(
      machineId,
      seed,
      this.collectionSystem.getCollectedItemIds(),
    );

    this.collectionSystem.addItem(result.itemId);
    this.timeSystem.advanceMinutes(8 + machine.tokenCost * 2);

    const completedSetNames = this.collectionSystem
      .getCompletedSets()
      .map((set) => set.name)
      .filter((name) => !this.currentReport.completedSetNames.includes(name));

    this.currentReport = {
      ...this.currentReport,
      tokensSpent: this.currentReport.tokensSpent + machine.tokenCost,
      itemsGained: [...this.currentReport.itemsGained, result],
      completedSetNames: [...this.currentReport.completedSetNames, ...completedSetNames],
    };
    this.addShiftLog(`Pulled ${result.item.name} from ${machine.seriesName}.`);
    this.persist();
    return result;
  }

  public endNight(): NightReport {
    const endedReport = {
      ...this.currentReport,
      endedAt: this.timeSystem.getClock(),
      tasksCompleted: this.taskSystem.getCompletedCount(),
      tasksTotal: this.taskSystem.getTotalCount(),
    };

    this.saveData = {
      ...this.saveData,
      night: this.saveData.night + 1,
    };
    this.currentReport = endedReport;
    this.persist();
    return endedReport;
  }

  public getLastReport(): NightReport {
    return this.currentReport;
  }

  public updateSettings(settings: Partial<SaveSettings>): void {
    this.saveData = {
      ...this.saveData,
      settings: {
        ...this.saveData.settings,
        ...settings,
      },
    };
    this.persist();
  }

  public getSnapshot(): SessionSnapshot {
    const balances = this.economySystem.getBalances();
    return {
      save: this.saveData,
      night: this.saveData.night,
      clock: this.timeSystem.getClock(),
      tasks: this.taskSystem.getTasks(),
      money: balances.money,
      tokens: balances.tokens,
      lifetimeMoney: balances.lifetimeMoney,
      lifetimeTokensUsed: balances.lifetimeTokensUsed,
      collectedCount: this.collectionSystem.getCount(),
      totalItems: ITEMS.length,
      completedSets: this.collectionSystem.getCompletedSets().length,
      totalSets: SETS.length,
      unlockedMachineIds: this.progressionSystem.getNightConfig(this.saveData.night)
        .unlockedMachineIds,
    };
  }

  public persist(): void {
    const balances = this.economySystem.getBalances();
    this.saveData = {
      ...this.saveData,
      money: balances.money,
      tokens: balances.tokens,
      lifetimeMoney: balances.lifetimeMoney,
      lifetimeTokensUsed: balances.lifetimeTokensUsed,
      collectedItemIds: this.collectionSystem.getCollectedItemIds(),
      machineStates: this.maintenanceSystem.toJSON(),
    };
    this.saveSystem.save(this.saveData);
  }

  private updateFlags(flags: Partial<SaveData['flags']>): void {
    this.saveData = {
      ...this.saveData,
      flags: {
        ...this.saveData.flags,
        ...flags,
      },
    };
  }

  private addShiftLog(entry: string): void {
    this.saveData = {
      ...this.saveData,
      shiftLog: [entry, ...this.saveData.shiftLog].slice(0, 12),
    };
  }

  private loadSafe(): SaveData {
    if (typeof window === 'undefined') {
      return DEFAULT_SAVE_DATA;
    }

    return this.saveSystem.load();
  }

  private createEmptyReport(): NightReport {
    return {
      night: this.saveData.night,
      tasksCompleted: 0,
      tasksTotal: 0,
      wagesEarned: 0,
      tokensSpent: 0,
      itemsGained: [],
      completedSetNames: [],
      secrets: [],
      endedAt: '22:00',
    };
  }
}
