/**
 * Night progression tuning.
 */
export interface ProgressionStep {
  readonly night: number;
  readonly taskCount: number;
  readonly unlockedMachineIds: readonly string[];
}

export const PROGRESSION_STEPS: readonly ProgressionStep[] = [
  {
    night: 1,
    taskCount: 3,
    unlockedMachineIds: [],
  },
];
