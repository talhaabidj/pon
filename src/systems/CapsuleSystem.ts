/**
 * CapsuleSystem — Gacha pull logic.
 *
 * Uses machine data + rarity weights to select an item.
 * Supports optional modifiers from maintenance state and time.
 */

import type { Item, Rarity, MachineDefinition, MachineState } from '../data/types.js';
import { getItemById } from '../data/items.js';

const RARITY_ORDER: Rarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mythical',
];

export interface PullResult {
  item: Item;
  machineId: string;
  wasModified: boolean;
}

export class CapsuleSystem {
  /**
   * Pull an item from a machine.
   *
   * @param machine - Machine definition with item pools and rarity weights
   * @param machineState - Optional maintenance state (affects rarity)
   * @param currentHour - Optional in-game hour (for time-locked items)
   * @param rng - Optional RNG function (for deterministic testing)
   */
  pull(
    machine: MachineDefinition,
    machineState?: MachineState,
    currentHour?: number,
    rng: () => number = Math.random,
  ): PullResult | null {
    if (machine.itemPoolIds.length === 0) return null;

    // Build effective rarity weights
    const weights = { ...machine.rarityWeights };
    let wasModified = false;

    // Maintenance modifier: dirty machines have worse rare chances
    if (machineState) {
      if (machineState.cleanliness === 'dirty') {
        weights.rare = Math.max(0, weights.rare * 0.7);
        weights.epic = Math.max(0, weights.epic * 0.5);
        weights.legendary = Math.max(0, weights.legendary * 0.3);
        weights.mythical = Math.max(0, weights.mythical * 0.2);
        weights.common += 15;
        wasModified = true;
      }

      // Generous-when-clean quirk
      if (
        machineState.cleanliness === 'clean' &&
        machine.quirks.includes('generous-when-clean')
      ) {
        weights.rare *= 1.3;
        weights.epic *= 1.2;
        weights.legendary *= 1.1;
        weights.mythical *= 1.05;
        wasModified = true;
      }
    }

    // Time-locked bonus: at 3 AM, boost high-tier rarity on compatible machines
    if (currentHour === 3) {
      weights.legendary *= 3;
      weights.mythical *= 3;
      wasModified = true;
    }

    // Select rarity via weighted random
    const selectedRarity = this.selectRarity(weights, rng);

    // Filter pool items by selected rarity
    const poolItems = machine.itemPoolIds
      .map((id) => getItemById(id))
      .filter((item): item is Item => item !== undefined);

    let candidates = poolItems.filter((item) => item.rarity === selectedRarity);

    // Fallback: if no items match selected rarity, pick from entire pool
    if (candidates.length === 0) {
      candidates = poolItems;
    }

    // Filter out time-locked items unless it's the right hour
    if (currentHour !== 3) {
      const nonTimeLocked = candidates.filter(
        (item) => !item.tags.includes('time-locked'),
      );
      if (nonTimeLocked.length > 0) {
        candidates = nonTimeLocked;
      }
    }

    // Random pick from candidates
    const index = Math.floor(rng() * candidates.length);
    const selectedItem = candidates[index];

    if (!selectedItem) return null;

    return {
      item: selectedItem,
      machineId: machine.id,
      wasModified,
    };
  }

  /** Weighted random rarity selection */
  private selectRarity(
    weights: Record<Rarity, number>,
    rng: () => number,
  ): Rarity {
    const totalWeight = RARITY_ORDER.reduce(
      (sum, r) => sum + (weights[r] ?? 0),
      0,
    );

    if (totalWeight <= 0) return 'common';

    let roll = rng() * totalWeight;

    for (const rarity of RARITY_ORDER) {
      roll -= weights[rarity] ?? 0;
      if (roll <= 0) return rarity;
    }

    return 'common';
  }
}
