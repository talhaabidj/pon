/**
 * Collection state and set completion helpers.
 */
import { ITEMS, type ItemDefinition } from '../data/items';
import { SETS, type SetDefinition } from '../data/sets';

export interface SetProgress {
  readonly set: SetDefinition;
  readonly collected: number;
  readonly total: number;
  readonly complete: boolean;
  readonly itemIds: readonly string[];
  readonly missingItemIds: readonly string[];
}

export class CollectionSystem {
  private readonly collectedItemIds = new Set<string>();

  public constructor(
    initialItemIds: readonly string[] = [],
    private readonly items: readonly ItemDefinition[] = ITEMS,
    private readonly sets: readonly SetDefinition[] = SETS,
  ) {
    initialItemIds.forEach((itemId) => this.addItem(itemId));
  }

  public addItem(itemId: string): boolean {
    this.getItem(itemId);
    const wasNew = !this.collectedItemIds.has(itemId);
    this.collectedItemIds.add(itemId);
    return wasNew;
  }

  public hasItem(itemId: string): boolean {
    return this.collectedItemIds.has(itemId);
  }

  public getCount(): number {
    return this.collectedItemIds.size;
  }

  public getCollectedItemIds(): readonly string[] {
    return [...this.collectedItemIds].sort();
  }

  public getOwnedItems(): readonly ItemDefinition[] {
    return this.getCollectedItemIds().map((itemId) => this.getItem(itemId));
  }

  public getSetProgress(setId: string): SetProgress {
    const set = this.getSet(setId);
    const missingItemIds = set.itemIds.filter((itemId) => !this.collectedItemIds.has(itemId));

    return {
      set,
      collected: set.itemIds.length - missingItemIds.length,
      total: set.itemIds.length,
      complete: missingItemIds.length === 0,
      itemIds: set.itemIds,
      missingItemIds,
    };
  }

  public getAllSetProgress(): readonly SetProgress[] {
    return this.sets.map((set) => this.getSetProgress(set.id));
  }

  public getCompletedSets(): readonly SetDefinition[] {
    return this.getAllSetProgress()
      .filter((progress) => progress.complete)
      .map((progress) => progress.set);
  }

  private getItem(itemId: string): ItemDefinition {
    const item = this.items.find((definition) => definition.id === itemId);
    if (!item) {
      throw new Error(`Cannot collect unknown item: ${itemId}`);
    }

    return item;
  }

  private getSet(setId: string): SetDefinition {
    const set = this.sets.find((definition) => definition.id === setId);
    if (!set) {
      throw new Error(`Unknown set id: ${setId}`);
    }

    return set;
  }
}
