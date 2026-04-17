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

export const ITEMS: readonly ItemDefinition[] = [
  {
    id: 'neon-cat-nap',
    name: 'Neon Cat Nap',
    rarity: 'common',
    setId: 'neon-cats',
    flavorText: 'A tiny cat curled around a glow-stick moon.',
    iconKey: 'cat-nap',
    tags: ['display-shelf'],
  },
  {
    id: 'neon-cat-vending',
    name: 'Vending Cat',
    rarity: 'common',
    setId: 'neon-cats',
    flavorText: 'It guards the warm cans after midnight.',
    iconKey: 'cat-vending',
    tags: ['display-shelf'],
  },
  {
    id: 'neon-cat-ticket',
    name: 'Ticket Gate Cat',
    rarity: 'uncommon',
    setId: 'neon-cats',
    flavorText: 'It stamps passes for trains that are not on any map.',
    iconKey: 'cat-ticket',
    tags: ['display-wall'],
  },
  {
    id: 'neon-cat-static',
    name: 'Static-Ear Calico',
    rarity: 'rare',
    setId: 'neon-cats',
    flavorText: 'Its ears crackle when a machine is about to jam.',
    iconKey: 'cat-static',
    tags: ['machine-sensitive'],
  },
  {
    id: 'robot-bento',
    name: 'Bento Bot',
    rarity: 'common',
    setId: 'retro-robots',
    flavorText: 'Programmed to pack rice into impossible shapes.',
    iconKey: 'robot-bento',
    tags: ['display-shelf'],
  },
  {
    id: 'robot-tape',
    name: 'Cassette Courier',
    rarity: 'common',
    setId: 'retro-robots',
    flavorText: 'Still rewinding a message from 1987.',
    iconKey: 'robot-tape',
    tags: ['display-shelf'],
  },
  {
    id: 'robot-bulb',
    name: 'Bulb-Head Clerk',
    rarity: 'uncommon',
    setId: 'retro-robots',
    flavorText: 'Its idea light turns on only after closing.',
    iconKey: 'robot-bulb',
    tags: ['shop-lore'],
  },
  {
    id: 'robot-coin',
    name: 'Coin-Return Oracle',
    rarity: 'secret',
    setId: 'retro-robots',
    flavorText: 'It predicts the next pull, then politely forgets.',
    iconKey: 'robot-coin',
    tags: ['time-locked'],
  },
  {
    id: 'spirit-moss',
    name: 'Moss Listener',
    rarity: 'common',
    setId: 'forest-spirits',
    flavorText: 'A little forest resident who hears dust settling.',
    iconKey: 'spirit-moss',
    tags: ['display-shelf'],
  },
  {
    id: 'spirit-lantern',
    name: 'Lantern Sprout',
    rarity: 'common',
    setId: 'forest-spirits',
    flavorText: 'It glows brighter near freshly cleaned glass.',
    iconKey: 'spirit-lantern',
    tags: ['maintenance'],
  },
  {
    id: 'spirit-umbrella',
    name: 'Umbrella Kodama',
    rarity: 'uncommon',
    setId: 'forest-spirits',
    flavorText: 'The canopy drips with indoor rain.',
    iconKey: 'spirit-umbrella',
    tags: ['weather'],
  },
  {
    id: 'spirit-shelf-door',
    name: 'Shelf-Door Spirit',
    rarity: 'rare',
    setId: 'forest-spirits',
    flavorText: 'It knows which shelves move when nobody is looking.',
    iconKey: 'spirit-shelf-door',
    tags: ['hidden-clue'],
  },
  {
    id: 'train-local',
    name: 'Last Local',
    rarity: 'common',
    setId: 'midnight-trains',
    flavorText: 'A two-car train with one lit window.',
    iconKey: 'train-local',
    tags: ['display-wall'],
  },
  {
    id: 'train-ticket',
    name: 'Sleepless Ticket',
    rarity: 'common',
    setId: 'midnight-trains',
    flavorText: 'The destination changes when you look away.',
    iconKey: 'train-ticket',
    tags: ['shop-lore'],
  },
  {
    id: 'train-platform',
    name: 'Platform 3:07',
    rarity: 'uncommon',
    setId: 'midnight-trains',
    flavorText: 'A platform sign for the hour when machines whisper.',
    iconKey: 'train-platform',
    tags: ['time-locked'],
  },
  {
    id: 'train-ghostline',
    name: 'Ghostline Express',
    rarity: 'secret',
    setId: 'midnight-trains',
    flavorText: 'It runs only after a jam is fixed at the right minute.',
    iconKey: 'train-ghostline',
    tags: ['time-locked', 'secret'],
  },
  {
    id: 'snack-melon',
    name: 'Melon Pan Charm',
    rarity: 'common',
    setId: 'seasonal-snacks',
    flavorText: 'Warm plastic bread, somehow comforting.',
    iconKey: 'snack-melon',
    tags: ['display-shelf'],
  },
  {
    id: 'snack-soda',
    name: 'Ramune Marble',
    rarity: 'common',
    setId: 'seasonal-snacks',
    flavorText: 'The marble taps back from inside the bottle.',
    iconKey: 'snack-soda',
    tags: ['sound'],
  },
  {
    id: 'snack-taiyaki',
    name: 'Taiyaki Twin',
    rarity: 'uncommon',
    setId: 'seasonal-snacks',
    flavorText: 'One fish smiles. The other knows why.',
    iconKey: 'snack-taiyaki',
    tags: ['display-shelf'],
  },
  {
    id: 'snack-moon-dango',
    name: 'Moon Dango Stack',
    rarity: 'rare',
    setId: 'seasonal-snacks',
    flavorText: 'Best eaten under fluorescent stars.',
    iconKey: 'snack-moon-dango',
    tags: ['night-only'],
  },
  {
    id: 'staff-key',
    name: 'Soft Brass Key',
    rarity: 'common',
    setId: 'staff-only',
    flavorText: 'A key for a cabinet that is not drawn on the floor plan.',
    iconKey: 'staff-key',
    tags: ['hidden-machine-only'],
  },
  {
    id: 'staff-point-card',
    name: 'Blank Point Card',
    rarity: 'uncommon',
    setId: 'staff-only',
    flavorText: 'Every stamp looks like a tiny closed eye.',
    iconKey: 'staff-point-card',
    tags: ['hidden-machine-only'],
  },
  {
    id: 'staff-mirror-capsule',
    name: 'Mirror Capsule',
    rarity: 'rare',
    setId: 'staff-only',
    flavorText: 'Inside is a room that looks almost like yours.',
    iconKey: 'staff-mirror-capsule',
    tags: ['hidden-machine-only', 'story'],
  },
  {
    id: 'staff-wonder-token',
    name: 'Wonder Token',
    rarity: 'secret',
    setId: 'staff-only',
    flavorText: 'It hums in the same key as the closed shop shutters.',
    iconKey: 'staff-wonder-token',
    tags: ['hidden-machine-only', 'secret'],
  },
];

export function getItemById(itemId: string): ItemDefinition {
  const item = ITEMS.find((definition) => definition.id === itemId);
  if (!item) {
    throw new Error(`Unknown item id: ${itemId}`);
  }

  return item;
}
