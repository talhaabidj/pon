/**
 * ProgressionSystem — Tracks nights worked and unlock conditions.
 *
 * Determines which machines and features are available,
 * gates time-based rare events, and manages night completion.
 */

import type { NightProgressionStep, GameState } from '../data/types.js';
import { getProgressionForNight } from '../data/progression.js';

export interface NightSummary {
  night: number;
  tasksCompleted: number;
  tasksTotal: number;
  moneyEarned: number;
  tokensSpent: number;
  itemsObtained: string[];
  secretsTriggered: string[];
}

export class ProgressionSystem {
  private nightsWorked: number;
  private secretsTriggered: Set<string>;

  constructor(nightsWorked = 0, secretsTriggered: string[] = []) {
    this.nightsWorked = nightsWorked;
    this.secretsTriggered = new Set(secretsTriggered);
  }

  /** Get current night number (1-based, the NEXT night to play) */
  getCurrentNight(): number {
    return this.nightsWorked + 1;
  }

  /** Get total nights worked */
  getNightsWorked(): number {
    return this.nightsWorked;
  }

  /** Get progression data for the current night */
  getCurrentProgression(): NightProgressionStep {
    return getProgressionForNight(this.getCurrentNight());
  }

  /** Complete a night and increment counter */
  completeNight(summary: NightSummary) {
    this.nightsWorked++;

    // Record any secrets
    for (const secret of summary.secretsTriggered) {
      this.secretsTriggered.add(secret);
    }
  }

  /** Check if a specific feature is unlocked */
  isUnlocked(featureId: string): boolean {
    const progression = this.getCurrentProgression();
    // Check if it was unlocked in a previous night
    for (let n = 1; n <= this.nightsWorked; n++) {
      const step = getProgressionForNight(n);
      if (step.unlocks.includes(featureId)) return true;
    }
    // Check current night
    return progression.unlocks.includes(featureId);
  }

  /** Check if a machine is available */
  isMachineAvailable(machineId: string): boolean {
    const progression = this.getCurrentProgression();
    return progression.availableMachineIds.includes(machineId);
  }

  /** Get triggered secrets */
  getSecretsTriggered(): string[] {
    return [...this.secretsTriggered];
  }

  /** Trigger a secret */
  triggerSecret(secretId: string): boolean {
    if (this.secretsTriggered.has(secretId)) return false;
    this.secretsTriggered.add(secretId);
    return true;
  }

  /** Load state */
  loadState(gameState: Pick<GameState, 'nightsWorked' | 'secretsTriggered'>) {
    this.nightsWorked = gameState.nightsWorked;
    this.secretsTriggered = new Set(gameState.secretsTriggered);
  }
}
