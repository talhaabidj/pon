/**
 * Night progression and unlock checks.
 */
import { getProgressionStep, type ProgressionStep } from '../data/progression';
import type { SaveData } from '../core/Save';

export class ProgressionSystem {
  public getNightConfig(night: number): ProgressionStep {
    return getProgressionStep(night);
  }

  public getUnlockedMachines(save: SaveData): readonly string[] {
    return this.getNightConfig(save.night).unlockedMachineIds;
  }

  public isHiddenMachineUnlocked(save: SaveData): boolean {
    return this.getNightConfig(save.night).hiddenMachineUnlocked || save.flags.hiddenMachineFound;
  }

  public getTaskCountForNight(night: number): number {
    return this.getNightConfig(night).taskCount;
  }
}
