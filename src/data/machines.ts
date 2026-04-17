/**
 * Gacha machine data definitions.
 */
import type { Rarity } from './items';

export interface MachinePosition {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly rotationY: number;
}

export interface MachineDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly seriesName: string;
  readonly itemIds: readonly string[];
  readonly rarityWeights: Readonly<Record<Rarity, number>>;
  readonly jamChance: number;
  readonly maintenanceDifficulty: number;
  readonly tokenCost: number;
  readonly unlockNight: number;
  readonly position: MachinePosition;
  readonly quirks: readonly string[];
}

export const MACHINES: readonly MachineDefinition[] = [
  {
    id: 'machine-neon-cats',
    displayName: 'Machine 01: Neon Cats',
    seriesName: 'Neon Cats',
    itemIds: ['neon-cat-nap', 'neon-cat-vending', 'neon-cat-ticket', 'neon-cat-static'],
    rarityWeights: { common: 68, uncommon: 24, rare: 7, secret: 1 },
    jamChance: 0.08,
    maintenanceDifficulty: 1,
    tokenCost: 1,
    unlockNight: 1,
    position: { x: -3, y: 0, z: -2.3, rotationY: 0 },
    quirks: ['glows when recently cleaned'],
  },
  {
    id: 'machine-retro-robots',
    displayName: 'Machine 02: Retro Robots',
    seriesName: 'Retro Robots',
    itemIds: ['robot-bento', 'robot-tape', 'robot-bulb', 'robot-coin'],
    rarityWeights: { common: 62, uncommon: 25, rare: 10, secret: 3 },
    jamChance: 0.12,
    maintenanceDifficulty: 2,
    tokenCost: 1,
    unlockNight: 1,
    position: { x: -1.75, y: 0, z: -2.3, rotationY: 0 },
    quirks: ['coin return clicks twice after midnight'],
  },
  {
    id: 'machine-forest-spirits',
    displayName: 'Machine 03: Forest Spirits',
    seriesName: 'Forest Spirits',
    itemIds: ['spirit-moss', 'spirit-lantern', 'spirit-umbrella', 'spirit-shelf-door'],
    rarityWeights: { common: 66, uncommon: 23, rare: 10, secret: 1 },
    jamChance: 0.1,
    maintenanceDifficulty: 2,
    tokenCost: 1,
    unlockNight: 1,
    position: { x: -0.5, y: 0, z: -2.3, rotationY: 0 },
    quirks: ['lens fogs when the AC cycles'],
  },
  {
    id: 'machine-midnight-trains',
    displayName: 'Machine 04: Midnight Trains',
    seriesName: 'Midnight Trains',
    itemIds: ['train-local', 'train-ticket', 'train-platform', 'train-ghostline'],
    rarityWeights: { common: 70, uncommon: 22, rare: 6, secret: 2 },
    jamChance: 0.15,
    maintenanceDifficulty: 2,
    tokenCost: 1,
    unlockNight: 1,
    position: { x: 0.75, y: 0, z: -2.3, rotationY: 0 },
    quirks: ['rare window around 03:00'],
  },
  {
    id: 'machine-seasonal-snacks',
    displayName: 'Machine 05: Seasonal Snacks',
    seriesName: 'Seasonal Snacks',
    itemIds: ['snack-melon', 'snack-soda', 'snack-taiyaki', 'snack-moon-dango'],
    rarityWeights: { common: 65, uncommon: 25, rare: 9, secret: 1 },
    jamChance: 0.08,
    maintenanceDifficulty: 1,
    tokenCost: 1,
    unlockNight: 2,
    position: { x: 2, y: 0, z: -2.3, rotationY: 0 },
    quirks: ['seasonal plate changes after set completion'],
  },
  {
    id: 'machine-wondertrade',
    displayName: 'Machine 00: Wondertrade',
    seriesName: 'Staff Only',
    itemIds: ['staff-key', 'staff-point-card', 'staff-mirror-capsule', 'staff-wonder-token'],
    rarityWeights: { common: 55, uncommon: 28, rare: 14, secret: 3 },
    jamChance: 0.18,
    maintenanceDifficulty: 3,
    tokenCost: 2,
    unlockNight: 3,
    position: { x: 3.3, y: 0, z: 1.25, rotationY: -Math.PI / 2 },
    quirks: ['hidden-machine-only', 'appears after completing unusual tasks'],
  },
];

export function getMachineById(machineId: string): MachineDefinition {
  const machine = MACHINES.find((definition) => definition.id === machineId);
  if (!machine) {
    throw new Error(`Unknown machine id: ${machineId}`);
  }

  return machine;
}
