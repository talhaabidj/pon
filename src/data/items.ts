/**
 * Item definitions for capsule prizes.
 */
export type Rarity = 'common' | 'uncommon' | 'rare' | 'secret';

export interface ItemDefinition {
  readonly id: string;
  readonly name: string;
  readonly rarity: Rarity;
  readonly setId: string;
  readonly flavorText: string;
  readonly iconKey: string;
  readonly tags: readonly string[];
}

export const ITEMS: readonly ItemDefinition[] = [];
