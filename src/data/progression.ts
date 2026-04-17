/**
 * Night progression tuning.
 */
export interface ProgressionStep {
  readonly night: number;
  readonly taskCount: number;
  readonly unlockedMachineIds: readonly string[];
  readonly note: string;
  readonly hiddenMachineUnlocked: boolean;
}

export const PROGRESSION_STEPS: readonly ProgressionStep[] = [
  {
    night: 1,
    taskCount: 3,
    unlockedMachineIds: [
      'machine-neon-cats',
      'machine-retro-robots',
      'machine-forest-spirits',
      'machine-midnight-trains',
    ],
    note: 'First night: learn the floor and keep the obvious machines happy.',
    hiddenMachineUnlocked: false,
  },
  {
    night: 2,
    taskCount: 4,
    unlockedMachineIds: [
      'machine-neon-cats',
      'machine-retro-robots',
      'machine-forest-spirits',
      'machine-midnight-trains',
      'machine-seasonal-snacks',
    ],
    note: 'A seasonal machine rolls out near the counter.',
    hiddenMachineUnlocked: false,
  },
  {
    night: 3,
    taskCount: 5,
    unlockedMachineIds: [
      'machine-neon-cats',
      'machine-retro-robots',
      'machine-forest-spirits',
      'machine-midnight-trains',
      'machine-seasonal-snacks',
      'machine-wondertrade',
    ],
    note: 'A staff-only unit fits into a gap that was not there yesterday.',
    hiddenMachineUnlocked: true,
  },
];

export function getProgressionStep(night: number): ProgressionStep {
  const sorted = [...PROGRESSION_STEPS].sort((a, b) => a.night - b.night);
  let active = sorted[0];

  for (const step of sorted) {
    if (night >= step.night) {
      active = step;
    }
  }

  return active;
}
