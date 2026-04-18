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
    const isNew = collection.addItem('neko-macaron');
    expect(isNew).toBe(true);
    expect(collection.hasItem('neko-macaron')).toBe(true);
    expect(collection.getOwnedCount()).toBe(1);
  });

  it('returns false when adding a duplicate', () => {
    collection.addItem('neko-macaron');
    const isNew = collection.addItem('neko-macaron');
    expect(isNew).toBe(false);
    expect(collection.getOwnedCount()).toBe(1);
  });

  it('tracks set progress', () => {
    collection.addItem('neko-macaron');
    collection.addItem('neko-croissant');

    const progress = collection.getSetProgress('neko-patisserie');
    expect(progress).not.toBeNull();
    expect(progress!.ownedCount).toBe(2);
    expect(progress!.totalCount).toBe(6);
    expect(progress!.isComplete).toBe(false);
    expect(progress!.ownedItemIds).toContain('neko-macaron');
    expect(progress!.missingItemIds).toContain('neko-donut');
  });

  it('detects set completion', () => {
    const nekoItems = [
      'neko-macaron', 'neko-croissant', 'neko-donut',
      'neko-eclair', 'neko-cake', 'neko-souffle',
    ];
    for (const id of nekoItems) {
      collection.addItem(id);
    }

    const progress = collection.getSetProgress('neko-patisserie');
    expect(progress!.isComplete).toBe(true);
    expect(collection.getCompletedSetCount()).toBe(1);
  });

  it('detects duplicates', () => {
    collection.addItem('neko-macaron');
    expect(collection.isDuplicate('neko-macaron')).toBe(true);
    expect(collection.isDuplicate('neko-cake')).toBe(false);
  });

  it('returns null for unknown set', () => {
    expect(collection.getSetProgress('nonexistent')).toBeNull();
  });

  it('loads state', () => {
    collection.loadState(['train-local', 'train-rapid']);
    expect(collection.getOwnedCount()).toBe(2);
    expect(collection.hasItem('train-local')).toBe(true);
  });

  it('getAllSetProgress returns all 4 sets', () => {
    const all = collection.getAllSetProgress();
    expect(all.length).toBe(4);
  });
});
