/**
 * machines.ts — Gacha machine definitions.
 *
 * 6 themed machines + 1 wonder exchange + 1 hidden machine.
 */

import type { MachineDefinition } from './types.js';

export const MACHINES: readonly MachineDefinition[] = [
  // Themed machines
  {
    id: 'machine-neko',
    name: 'Kitty Cakes',
    position: [-4.8, 0, -4.2],
    rotation: 0,
    itemPoolIds: [
      'kitty-cupcake-cat',
      'kitty-tart-tabby',
      'kitty-mille-feuille',
      'kitty-chiffon-whiskers',
      'kitty-royal-velvet',
      'kitty-celestial-cheesecake',
    ],
    rarityWeights: {
      common: 40,
      uncommon: 24,
      rare: 16,
      epic: 10,
      legendary: 7,
      mythical: 3,
    },
    maintenanceDifficulty: 2,
    quirks: ['generous-when-clean'],
  },
  {
    id: 'machine-train',
    name: 'If I Fits I Sits',
    position: [-2.4, 0, -4.2],
    rotation: 0,
    itemPoolIds: [
      'fits-cardboard-box',
      'fits-basket',
      'fits-plant-pot',
      'fits-glass-bowl',
      'fits-tea-kettle',
      'fits-quantum-crate',
    ],
    rarityWeights: {
      common: 38,
      uncommon: 25,
      rare: 17,
      epic: 10,
      legendary: 7,
      mythical: 3,
    },
    maintenanceDifficulty: 3,
    quirks: ['jams-often'],
  },
  {
    id: 'machine-moon',
    name: 'Cats Vs Cucumbers',
    position: [0, 0, -4.2],
    rotation: 0,
    itemPoolIds: [
      'cucumber-lounge',
      'cucumber-sniffer',
      'cucumber-side-eye',
      'cucumber-terrified',
      'cucumber-rider',
      'cucumber-hybrid',
    ],
    rarityWeights: {
      common: 36,
      uncommon: 24,
      rare: 18,
      epic: 11,
      legendary: 7,
      mythical: 4,
    },
    maintenanceDifficulty: 2,
    quirks: ['generous-when-clean'],
  },
  {
    id: 'machine-pixel',
    name: 'Meme Meownia',
    position: [2.4, 0, -4.2],
    rotation: 0,
    itemPoolIds: [
      'meme-keyboard',
      'meme-grumpy',
      'meme-ceiling',
      'meme-nyan',
      'meme-longcat',
      'meme-overlord',
    ],
    rarityWeights: {
      common: 34,
      uncommon: 24,
      rare: 18,
      epic: 12,
      legendary: 8,
      mythical: 4,
    },
    maintenanceDifficulty: 3,
    quirks: [],
  },
  {
    id: 'machine-mix-a',
    name: 'Loaf Legends',
    position: [-4.8, 0, -1.6],
    rotation: 0,
    itemPoolIds: [
      'zoomies-sofa-sprint',
      'zoomies-curtain-climber',
      'zoomies-hallway-drift',
      'zoomies-fridge-parkour',
      'zoomies-sonic',
      'zoomies-timewarp',
    ],
    rarityWeights: {
      common: 42,
      uncommon: 24,
      rare: 16,
      epic: 9,
      legendary: 6,
      mythical: 3,
    },
    maintenanceDifficulty: 2,
    quirks: [],
  },
  {
    id: 'machine-mix-b',
    name: 'Astro Whiskers',
    position: [-2.4, 0, -1.6],
    rotation: 0,
    itemPoolIds: [
      'cosmic-stardust',
      'cosmic-orbit',
      'cosmic-nebula',
      'cosmic-comet',
      'cosmic-supernova',
      'cosmic-void-empress',
    ],
    rarityWeights: {
      common: 30,
      uncommon: 24,
      rare: 20,
      epic: 13,
      legendary: 8,
      mythical: 5,
    },
    maintenanceDifficulty: 4,
    quirks: ['jams-often'],
  },

  // Trade machine
  {
    id: 'machine-wondertrade',
    name: 'Wonder Exchange',
    position: [0, 0, -1.6],
    rotation: 0,
    itemPoolIds: [],
    rarityWeights: {
      common: 28,
      uncommon: 24,
      rare: 20,
      epic: 14,
      legendary: 10,
      mythical: 4,
    },
    maintenanceDifficulty: 2,
    quirks: [],
    unlockCondition: {
      type: 'nights_worked',
      threshold: 3,
      unlocks: 'wondertrade',
    },
  },

  // Secret machine with higher-tier drops
  {
    id: 'machine-hidden',
    name: 'Mythic Backroom',
    position: [2.4, 0, -1.6],
    rotation: 0,
    itemPoolIds: [
      'kitty-royal-velvet',
      'kitty-celestial-cheesecake',
      'fits-tea-kettle',
      'fits-quantum-crate',
      'cucumber-rider',
      'cucumber-hybrid',
      'meme-longcat',
      'meme-overlord',
      'zoomies-sonic',
      'zoomies-timewarp',
      'cosmic-supernova',
      'cosmic-void-empress',
    ],
    rarityWeights: {
      common: 0,
      uncommon: 8,
      rare: 17,
      epic: 26,
      legendary: 29,
      mythical: 20,
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
