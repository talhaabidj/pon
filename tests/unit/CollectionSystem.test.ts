/**
 * CollectionSystem unit tests.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CollectionSystem } from '../../src/systems/CollectionSystem.js';

describe('CollectionSystem', () => {
  let collection: CollectionSystem;

  beforeEach(() => {
    collection = new CollectionSystem();
  });

  it('starts empty', () => {
    expect(collection.getOwnedCount()).toBe(0);
    expect(collection.getOwnedItemIds()).toEqual([]);
  });

  it('adds a new item and returns true', () => {
    const isNew = collection.addItem('kitty-cupcake-cat');
    expect(isNew).toBe(true);
    expect(collection.hasItem('kitty-cupcake-cat')).toBe(true);
    expect(collection.getOwnedCount()).toBe(1);
  });

  it('returns false when adding a duplicate', () => {
    collection.addItem('kitty-cupcake-cat');
    const isNew = collection.addItem('kitty-cupcake-cat');
    expect(isNew).toBe(false);
    expect(collection.getOwnedCount()).toBe(1);
  });

  it('tracks set progress', () => {
    collection.addItem('kitty-cupcake-cat');
    collection.addItem('kitty-tart-tabby');

    const progress = collection.getSetProgress('kitty-cakes');
    expect(progress).not.toBeNull();
    expect(progress!.ownedCount).toBe(2);
    expect(progress!.totalCount).toBe(6);
    expect(progress!.isComplete).toBe(false);
    expect(progress!.ownedItemIds).toContain('kitty-cupcake-cat');
    expect(progress!.missingItemIds).toContain('kitty-mille-feuille');
  });

  it('detects set completion', () => {
    const kittyItems = [
      'kitty-cupcake-cat',
      'kitty-tart-tabby',
      'kitty-mille-feuille',
      'kitty-chiffon-whiskers',
      'kitty-royal-velvet',
      'kitty-celestial-cheesecake',
    ];
    for (const id of kittyItems) {
      collection.addItem(id);
    }

    const progress = collection.getSetProgress('kitty-cakes');
    expect(progress!.isComplete).toBe(true);
    expect(collection.getCompletedSetCount()).toBe(1);
  });

  it('detects duplicates', () => {
    collection.addItem('kitty-cupcake-cat');
    expect(collection.isDuplicate('kitty-cupcake-cat')).toBe(true);
    expect(collection.isDuplicate('kitty-royal-velvet')).toBe(false);
  });

  it('returns null for unknown set', () => {
    expect(collection.getSetProgress('nonexistent')).toBeNull();
  });

  it('loads state', () => {
    collection.loadState(['fits-cardboard-box', 'fits-basket']);
    expect(collection.getOwnedCount()).toBe(2);
    expect(collection.hasItem('fits-cardboard-box')).toBe(true);
  });

  it('getAllSetProgress returns all 6 sets', () => {
    const all = collection.getAllSetProgress();
    expect(all.length).toBe(6);
  });
});
