/**
 * items.ts — All collectible items in Catchapon.
 *
 * 4 sets × 6 items = 24 items total for first release.
 * Each item has a rarity, set, flavor text, and optional tags.
 */

import type { Item } from './types.js';

export const ITEMS: readonly Item[] = [
  // ————————————————————————————————
  // Set 1: Neko Patisserie (cat desserts)
  // ————————————————————————————————
  {
    id: 'neko-macaron',
    name: 'Macaron Mew',
    rarity: 'common',
    setId: 'neko-patisserie',
    flavorText: 'A pastel pink macaron with tiny cat ears. Tastes like strawberry dreams.',
    iconKey: 'neko-macaron',
    tags: [],
  },
  {
    id: 'neko-croissant',
    name: 'Croissant Calico',
    rarity: 'common',
    setId: 'neko-patisserie',
    flavorText: 'Flaky golden layers hide a sleepy calico kitten inside.',
    iconKey: 'neko-croissant',
    tags: [],
  },
  {
    id: 'neko-donut',
    name: 'Donut Tabby',
    rarity: 'uncommon',
    setId: 'neko-patisserie',
    flavorText: 'A chocolate-glazed donut with sprinkle whiskers and a tabby tail.',
    iconKey: 'neko-donut',
    tags: [],
  },
  {
    id: 'neko-eclair',
    name: 'Éclair Siamese',
    rarity: 'uncommon',
    setId: 'neko-patisserie',
    flavorText: 'Elegant and long, this éclair has piercing blue candy eyes.',
    iconKey: 'neko-eclair',
    tags: [],
  },
  {
    id: 'neko-cake',
    name: 'Shortcake Bengal',
    rarity: 'rare',
    setId: 'neko-patisserie',
    flavorText: 'A strawberry shortcake with wild rosette fur patterns. Very photogenic.',
    iconKey: 'neko-cake',
    tags: [],
  },
  {
    id: 'neko-souffle',
    name: 'Soufflé Sphinx',
    rarity: 'epic',
    setId: 'neko-patisserie',
    flavorText: 'Rises perfectly every time. Stares at you with ancient, dessert-knowing eyes.',
    iconKey: 'neko-souffle',
    tags: [],
  },

  // ————————————————————————————————
  // Set 2: Express Line (train mascots)
  // ————————————————————————————————
  {
    id: 'train-local',
    name: 'Local Liner',
    rarity: 'common',
    setId: 'express-line',
    flavorText: 'The everyday hero. Stops at every station, never complains.',
    iconKey: 'train-local',
    tags: [],
  },
  {
    id: 'train-rapid',
    name: 'Rapid Runner',
    rarity: 'common',
    setId: 'express-line',
    flavorText: 'Skips the small stops. Has places to be.',
    iconKey: 'train-rapid',
    tags: [],
  },
  {
    id: 'train-express',
    name: 'Express Ace',
    rarity: 'uncommon',
    setId: 'express-line',
    flavorText: 'Wind-swept and gleaming. Only the important stations.',
    iconKey: 'train-express',
    tags: [],
  },
  {
    id: 'train-limited',
    name: 'Limited Edition',
    rarity: 'uncommon',
    setId: 'express-line',
    flavorText: 'Reserved seats only. Comes with a tiny bento box accessory.',
    iconKey: 'train-limited',
    tags: [],
  },
  {
    id: 'train-shinkansen',
    name: 'Bullet Blaze',
    rarity: 'rare',
    setId: 'express-line',
    flavorText: 'Nose like an arrow, speed like a thought. The pride of the line.',
    iconKey: 'train-shinkansen',
    tags: [],
  },
  {
    id: 'train-phantom',
    name: 'Phantom Express',
    rarity: 'epic',
    setId: 'express-line',
    flavorText: 'Runs on no known schedule. Passengers arrive before they depart.',
    iconKey: 'train-phantom',
    tags: [],
  },

  // ————————————————————————————————
  // Set 3: Moonlight Garden (night flora)
  // ————————————————————————————————
  {
    id: 'moon-fern',
    name: 'Silverfern',
    rarity: 'common',
    setId: 'moonlight-garden',
    flavorText: 'Unfurls only under moonlight. Leaves shimmer like liquid mercury.',
    iconKey: 'moon-fern',
    tags: [],
  },
  {
    id: 'moon-moss',
    name: 'Starglow Moss',
    rarity: 'common',
    setId: 'moonlight-garden',
    flavorText: 'Soft green carpet that pulses faintly with bioluminescence.',
    iconKey: 'moon-moss',
    tags: [],
  },
  {
    id: 'moon-lily',
    name: 'Dusk Lily',
    rarity: 'uncommon',
    setId: 'moonlight-garden',
    flavorText: 'Opens at sunset, closes at dawn. Petals feel like cool silk.',
    iconKey: 'moon-lily',
    tags: [],
  },
  {
    id: 'moon-vine',
    name: 'Twilight Creeper',
    rarity: 'uncommon',
    setId: 'moonlight-garden',
    flavorText: 'Grows an inch every night. Nobody knows where it\'s headed.',
    iconKey: 'moon-vine',
    tags: [],
  },
  {
    id: 'moon-orchid',
    name: 'Eclipse Orchid',
    rarity: 'rare',
    setId: 'moonlight-garden',
    flavorText: 'Blooms only during lunar eclipses. Smells like cold starlight.',
    iconKey: 'moon-orchid',
    tags: [],
  },
  {
    id: 'moon-tree',
    name: 'Dreamwood Sapling',
    rarity: 'epic',
    setId: 'moonlight-garden',
    flavorText: 'Plant it and it grows into your dreams. Literally.',
    iconKey: 'moon-tree',
    tags: [],
  },

  // ————————————————————————————————
  // Set 4: Pixel Legends (retro game characters)
  // ————————————————————————————————
  {
    id: 'pixel-knight',
    name: 'Pixel Knight',
    rarity: 'common',
    setId: 'pixel-legends',
    flavorText: '8-bit sword, 8-bit shield, infinite determination.',
    iconKey: 'pixel-knight',
    tags: [],
  },
  {
    id: 'pixel-mage',
    name: 'Glitch Mage',
    rarity: 'common',
    setId: 'pixel-legends',
    flavorText: 'Casts spells by exploiting buffer overflows.',
    iconKey: 'pixel-mage',
    tags: [],
  },
  {
    id: 'pixel-thief',
    name: 'Sprite Thief',
    rarity: 'uncommon',
    setId: 'pixel-legends',
    flavorText: 'Steals items from other figurines when you\'re not looking.',
    iconKey: 'pixel-thief',
    tags: [],
  },
  {
    id: 'pixel-healer',
    name: 'Potion Princess',
    rarity: 'uncommon',
    setId: 'pixel-legends',
    flavorText: 'Her potions restore HP and taste like cherry soda.',
    iconKey: 'pixel-healer',
    tags: [],
  },
  {
    id: 'pixel-dragon',
    name: 'Boss Dragon',
    rarity: 'rare',
    setId: 'pixel-legends',
    flavorText: 'Final boss of World 8. Takes 99 hits. Worth every one.',
    iconKey: 'pixel-dragon',
    tags: [],
  },
  {
    id: 'pixel-dev',
    name: 'The Developer',
    rarity: 'legendary',
    setId: 'pixel-legends',
    flavorText: 'Created the world, then forgot the save function. Classic.',
    iconKey: 'pixel-dev',
    tags: ['hidden-machine'],
  },

  // ————————————————————————————————
  // Special items (time-locked / secret)
  // ————————————————————————————————
  {
    id: 'secret-golden-capsule',
    name: 'Golden Capsule',
    rarity: 'legendary',
    setId: 'pixel-legends',
    flavorText: 'They say it only appears at 3 AM. Contains something that shouldn\'t exist.',
    iconKey: 'golden-capsule',
    tags: ['time-locked'],
  },
] as const;

/** Lookup item by ID */
export function getItemById(id: string): Item | undefined {
  return ITEMS.find((item) => item.id === id);
}

/** Get all items for a given set */
export function getItemsBySet(setId: string): Item[] {
  return ITEMS.filter((item) => item.setId === setId);
}
