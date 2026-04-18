/**
 * CollectionSystem — Tracks owned items and set completion.
 *
 * Pure logic. Operates on item IDs and set definitions.
 */

import { SETS } from '../data/sets.js';
import { getItemById } from '../data/items.js';
import type { Item, ItemSet } from '../data/types.js';

export interface SetProgress {
  set: ItemSet;
  ownedCount: number;
  totalCount: number;
  isComplete: boolean;
  ownedItemIds: string[];
  missingItemIds: string[];
}

export class CollectionSystem {
  private ownedItemIds: Set<string>;

  constructor(initialOwned: string[] = []) {
    this.ownedItemIds = new Set(initialOwned);
  }

  /** Add an item to the collection. Returns true if it's new. */
  addItem(itemId: string): boolean {
    if (this.ownedItemIds.has(itemId)) return false;
    this.ownedItemIds.add(itemId);
    return true;
  }

  /** Check if an item is owned */
  hasItem(itemId: string): boolean {
    return this.ownedItemIds.has(itemId);
  }

  /** Get all owned item IDs */
  getOwnedItemIds(): string[] {
    return [...this.ownedItemIds];
  }

  /** Get count of owned items */
  getOwnedCount(): number {
    return this.ownedItemIds.size;
  }

  /** Get full Item objects for owned items */
  getOwnedItems(): Item[] {
    const items: Item[] = [];
    for (const id of this.ownedItemIds) {
      const item = getItemById(id);
      if (item) items.push(item);
    }
    return items;
  }

  /** Get progress for a specific set */
  getSetProgress(setId: string): SetProgress | null {
    const set = SETS.find((s) => s.id === setId);
    if (!set) return null;

    const ownedInSet = set.itemIds.filter((id) =>
      this.ownedItemIds.has(id),
    );
    const missingInSet = set.itemIds.filter(
      (id) => !this.ownedItemIds.has(id),
    );

    return {
      set,
      ownedCount: ownedInSet.length,
      totalCount: set.itemIds.length,
      isComplete: ownedInSet.length === set.itemIds.length,
      ownedItemIds: ownedInSet,
      missingItemIds: missingInSet,
    };
  }

  /** Get progress for all sets */
  getAllSetProgress(): SetProgress[] {
    return SETS.map((s) => this.getSetProgress(s.id)!);
  }

  /** Count completed sets */
  getCompletedSetCount(): number {
    return this.getAllSetProgress().filter((p) => p.isComplete).length;
  }

  /** Check if an item is a duplicate (already owned) */
  isDuplicate(itemId: string): boolean {
    return this.ownedItemIds.has(itemId);
  }

  /** Get duplicate item IDs from owned collection */
  getDuplicateCandidates(): string[] {
    // For Wondertrade: all owned items are potential trade-away candidates
    return [...this.ownedItemIds];
  }

  /** Load state */
  loadState(ownedIds: string[]) {
    this.ownedItemIds = new Set(ownedIds);
  }
}
