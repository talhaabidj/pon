/**
 * sets.ts — Item set definitions for Catchapon.
 *
 * 6 themed sets, each with exactly 6 items
 * (common, uncommon, rare, epic, legendary, mythical).
 */

import type { ItemSet } from './types.js';

export const SETS: readonly ItemSet[] = [
  {
    id: 'kitty-cakes',
    name: 'Kitty Cakes',
    theme: 'Dessert-themed cats from a late-night feline bakery',
    itemIds: [
      'kitty-cupcake-cat',
      'kitty-tart-tabby',
      'kitty-mille-feuille',
      'kitty-chiffon-whiskers',
      'kitty-royal-velvet',
      'kitty-celestial-cheesecake',
    ],
    completionReward: 'Unlocks a pastry-cat mini display for your bedroom shelf.',
  },
  {
    id: 'if-i-fits-i-sits',
    name: 'If I Fits I Sits',
    theme: 'Cats stuffing themselves into increasingly impossible containers',
    itemIds: [
      'fits-cardboard-box',
      'fits-basket',
      'fits-plant-pot',
      'fits-glass-bowl',
      'fits-tea-kettle',
      'fits-quantum-crate',
    ],
    completionReward: 'Unlocks a cozy container corner prop beside your PC desk.',
  },
  {
    id: 'cats-vs-cucumbers',
    name: 'Cats Vs Cucumbers',
    theme: 'The internet rivalry between cats and suspicious green vegetables',
    itemIds: [
      'cucumber-lounge',
      'cucumber-sniffer',
      'cucumber-side-eye',
      'cucumber-terrified',
      'cucumber-rider',
      'cucumber-hybrid',
    ],
    completionReward: 'Unlocks a cucumber caution sign for the shop backroom.',
  },
  {
    id: 'cat-memes',
    name: 'Meme Meownia',
    theme: 'Classic and chaotic meme-era cats from internet folklore',
    itemIds: [
      'meme-keyboard',
      'meme-grumpy',
      'meme-ceiling',
      'meme-nyan',
      'meme-longcat',
      'meme-overlord',
    ],
    completionReward: 'Unlocks a meme poster pack for the bedroom wall.',
  },
  {
    id: 'midnight-zoomies',
    name: 'Loaf Legends',
    theme: 'High-speed feline chaos from the no-sleep hours',
    itemIds: [
      'zoomies-sofa-sprint',
      'zoomies-curtain-climber',
      'zoomies-hallway-drift',
      'zoomies-fridge-parkour',
      'zoomies-sonic',
      'zoomies-timewarp',
    ],
    completionReward: 'Unlocks a tiny race-track rug by your bedroom bed.',
  },
  {
    id: 'cosmic-cat-club',
    name: 'Astro Whiskers',
    theme: 'Spacefaring cats, stellar hunters, and void royalty',
    itemIds: [
      'cosmic-stardust',
      'cosmic-orbit',
      'cosmic-nebula',
      'cosmic-comet',
      'cosmic-supernova',
      'cosmic-void-empress',
    ],
    completionReward: 'Unlocks a constellation projector for your ceiling.',
  },
] as const;

/** Lookup set by ID */
export function getSetById(id: string): ItemSet | undefined {
  return SETS.find((s) => s.id === id);
}
