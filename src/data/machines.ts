/**
 * machines.ts — Gacha machine definitions.
 *
 * 6 standard machines + 1 hidden machine + 1 Wondertrade = 8 total.
 */

import type { MachineDefinition } from './types.js';

export const MACHINES: readonly MachineDefinition[] = [
  // ————————————————————————————————
  // Row 1 (Z = -4): Set-specific machines
  // ————————————————————————————————
  {
    id: 'machine-neko',
    name: 'Pâtisserie Neko',
    position: [-3, 0, -4],
    rotation: 0,
    itemPoolIds: [
      'neko-macaron', 'neko-croissant', 'neko-donut',
      'neko-eclair', 'neko-cake', 'neko-souffle',
    ],
    rarityWeights: {
      common: 40, uncommon: 30, rare: 20, epic: 9, legendary: 1,
    },
    maintenanceDifficulty: 2,
    quirks: ['generous-when-clean'],
  },
  {
    id: 'machine-train',
    name: 'Express Line Depot',
    position: [-1, 0, -4],
    rotation: 0,
    itemPoolIds: [
      'train-local', 'train-rapid', 'train-express',
      'train-limited', 'train-shinkansen', 'train-phantom',
    ],
    rarityWeights: {
      common: 38, uncommon: 30, rare: 20, epic: 11, legendary: 1,
    },
    maintenanceDifficulty: 3,
    quirks: ['jams-often'],
  },
  {
    id: 'machine-moon',
    name: 'Lunar Greenhouse',
    position: [1, 0, -4],
    rotation: 0,
    itemPoolIds: [
      'moon-fern', 'moon-moss', 'moon-lily',
      'moon-vine', 'moon-orchid', 'moon-tree',
    ],
    rarityWeights: {
      common: 35, uncommon: 32, rare: 22, epic: 10, legendary: 1,
    },
    maintenanceDifficulty: 2,
    quirks: ['generous-when-clean'],
  },
  {
    id: 'machine-pixel',
    name: 'Pixel Arcade',
    position: [3, 0, -4],
    rotation: 0,
    itemPoolIds: [
      'pixel-knight', 'pixel-mage', 'pixel-thief',
      'pixel-healer', 'pixel-dragon',
    ],
    rarityWeights: {
      common: 40, uncommon: 28, rare: 22, epic: 9, legendary: 1,
    },
    maintenanceDifficulty: 3,
    quirks: [],
  },

  // ————————————————————————————————
  // Row 2 (Z = 1): Mixed + specialty
  // ————————————————————————————————
  {
    id: 'machine-mix-a',
    name: 'Lucky Mix α',
    position: [-3, 0, 1],
    rotation: 0,
    itemPoolIds: [
      'neko-macaron', 'train-local', 'moon-fern', 'pixel-knight',
      'neko-donut', 'train-express', 'moon-lily', 'pixel-thief',
    ],
    rarityWeights: {
      common: 45, uncommon: 30, rare: 18, epic: 6, legendary: 1,
    },
    maintenanceDifficulty: 1,
    quirks: [],
  },
  {
    id: 'machine-mix-b',
    name: 'Lucky Mix β',
    position: [-1, 0, 1],
    rotation: 0,
    itemPoolIds: [
      'neko-eclair', 'train-limited', 'moon-vine', 'pixel-healer',
      'neko-cake', 'train-shinkansen', 'moon-orchid', 'pixel-dragon',
    ],
    rarityWeights: {
      common: 30, uncommon: 30, rare: 25, epic: 13, legendary: 2,
    },
    maintenanceDifficulty: 4,
    quirks: ['jams-often'],
  },

  // ————————————————————————————————
  // Wondertrade (trade duplicates)
  // ————————————————————————————————
  {
    id: 'machine-wondertrade',
    name: 'Wonder Exchange',
    position: [1, 0, 1],
    rotation: 0,
    itemPoolIds: [], // Special: uses CollectionSystem for trade logic
    rarityWeights: {
      common: 30, uncommon: 30, rare: 25, epic: 12, legendary: 3,
    },
    maintenanceDifficulty: 2,
    quirks: [],
    unlockCondition: {
      type: 'nights_worked',
      threshold: 3,
      unlocks: 'wondertrade',
    },
  },

  // ————————————————————————————————
  // Hidden machine (secret)
  // ————————————————————————————————
  {
    id: 'machine-hidden',
    name: '???',
    position: [3, 0, 1],
    rotation: 0,
    itemPoolIds: [
      'pixel-dev', 'neko-souffle', 'train-phantom',
      'moon-tree', 'secret-golden-capsule',
    ],
    rarityWeights: {
      common: 0, uncommon: 10, rare: 30, epic: 40, legendary: 20,
    },
    maintenanceDifficulty: 5,
    quirks: ['generous-when-clean', 'jams-often'],
    unlockCondition: {
      type: 'nights_worked',
      threshold: 5,
      unlocks: 'hidden_machine',
    },
  },
] as const;

/** Lookup machine by ID */
export function getMachineById(id: string): MachineDefinition | undefined {
  return MACHINES.find((m) => m.id === id);
}

/** Get machines available for a given night (checks unlock conditions) */
export function getAvailableMachines(
  nightsWorked: number,
  _secretsTriggered: string[] = [],
): MachineDefinition[] {
  return MACHINES.filter((m) => {
    if (!m.unlockCondition) return true;
    if (m.unlockCondition.type === 'nights_worked') {
      return nightsWorked >= m.unlockCondition.threshold;
    }
    return false;
  });
}
