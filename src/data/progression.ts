/**
 * progression.ts — Night-by-night progression data.
 *
 * Controls how each night escalates: more tasks, harder machines,
 * new content unlocks.
 */

import type { NightProgressionStep } from './types.js';

export const PROGRESSION: readonly NightProgressionStep[] = [
  {
    night: 1,
    taskCount: [3, 4],
    availableMachineIds: [
      'machine-neko', 'machine-train', 'machine-moon', 'machine-pixel',
      'machine-mix-a',
    ],
    unlocks: [],
    difficultyModifier: 1.0,
  },
  {
    night: 2,
    taskCount: [3, 5],
    availableMachineIds: [
      'machine-neko', 'machine-train', 'machine-moon', 'machine-pixel',
      'machine-mix-a', 'machine-mix-b',
    ],
    unlocks: ['machine-mix-b'],
    difficultyModifier: 1.1,
  },
  {
    night: 3,
    taskCount: [4, 5],
    availableMachineIds: [
      'machine-neko', 'machine-train', 'machine-moon', 'machine-pixel',
      'machine-mix-a', 'machine-mix-b', 'machine-wondertrade',
    ],
    unlocks: ['wondertrade'],
    difficultyModifier: 1.2,
  },
  {
    night: 4,
    taskCount: [4, 6],
    availableMachineIds: [
      'machine-neko', 'machine-train', 'machine-moon', 'machine-pixel',
      'machine-mix-a', 'machine-mix-b', 'machine-wondertrade',
    ],
    unlocks: [],
    difficultyModifier: 1.3,
  },
  {
    night: 5,
    taskCount: [5, 7],
    availableMachineIds: [
      'machine-neko', 'machine-train', 'machine-moon', 'machine-pixel',
      'machine-mix-a', 'machine-mix-b', 'machine-wondertrade',
      'machine-hidden',
    ],
    unlocks: ['hidden_machine'],
    difficultyModifier: 1.4,
  },
  {
    night: 6,
    taskCount: [5, 7],
    availableMachineIds: [
      'machine-neko', 'machine-train', 'machine-moon', 'machine-pixel',
      'machine-mix-a', 'machine-mix-b', 'machine-wondertrade',
      'machine-hidden',
    ],
    unlocks: [],
    difficultyModifier: 1.5,
  },
] as const;

/**
 * Get progression step for a given night number.
 * If night exceeds defined steps, returns the last step
 * with scaled difficulty.
 */
export function getProgressionForNight(night: number): NightProgressionStep {
  if (night <= PROGRESSION.length) {
    return PROGRESSION[night - 1]!;
  }

  // Beyond defined steps: use last step as template with scaled difficulty
  const last = PROGRESSION[PROGRESSION.length - 1]!;
  return {
    ...last,
    night,
    difficultyModifier:
      last.difficultyModifier + (night - PROGRESSION.length) * 0.1,
  };
}
