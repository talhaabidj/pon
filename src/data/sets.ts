/**
 * sets.ts — Item set definitions for Catchapon.
 *
 * 4 themed sets, each with 6 items (+ 1 secret item in set 4).
 */

import type { ItemSet } from './types.js';

export const SETS: readonly ItemSet[] = [
  {
    id: 'neko-patisserie',
    name: 'Neko Patisserie',
    theme: 'Cat-shaped pastries and desserts from a feline bakery',
    itemIds: [
      'neko-macaron',
      'neko-croissant',
      'neko-donut',
      'neko-eclair',
      'neko-cake',
      'neko-souffle',
    ],
    completionReward:
      'Unlocks a tiny bakery display shelf for your bedroom wall.',
  },
  {
    id: 'express-line',
    name: 'Express Line',
    theme: 'Anthropomorphic train mascots from every service tier',
    itemIds: [
      'train-local',
      'train-rapid',
      'train-express',
      'train-limited',
      'train-shinkansen',
      'train-phantom',
    ],
    completionReward:
      'Unlocks a model railway diorama for your bedroom desk.',
  },
  {
    id: 'moonlight-garden',
    name: 'Moonlight Garden',
    theme: 'Bioluminescent plants that bloom only at night',
    itemIds: [
      'moon-fern',
      'moon-moss',
      'moon-lily',
      'moon-vine',
      'moon-orchid',
      'moon-tree',
    ],
    completionReward:
      'Unlocks a glowing terrarium for your bedroom windowsill.',
  },
  {
    id: 'pixel-legends',
    name: 'Pixel Legends',
    theme: 'Classic RPG character figurines in retro pixel style',
    itemIds: [
      'pixel-knight',
      'pixel-mage',
      'pixel-thief',
      'pixel-healer',
      'pixel-dragon',
      'pixel-dev',
    ],
    completionReward:
      'Unlocks a CRT monitor prop for your bedroom that plays a tiny game.',
  },
] as const;

/** Lookup set by ID */
export function getSetById(id: string): ItemSet | undefined {
  return SETS.find((s) => s.id === id);
}
