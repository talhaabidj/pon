/**
 * Collection state and set completion helpers.
 */
export class CollectionSystem {
  private readonly collectedItemIds = new Set<string>();

  public addItem(itemId: string): boolean {
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
}
