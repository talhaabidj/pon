/**
 * Gacha machine data definitions.
 */
import type { Rarity } from './items';

export interface MachineDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly itemIds: readonly string[];
  readonly rarityWeights: Readonly<Record<Rarity, number>>;
  readonly jamChance: number;
  readonly maintenanceDifficulty: number;
}

export const MACHINES: readonly MachineDefinition[] = [];
