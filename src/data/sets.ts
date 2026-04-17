/**
 * Collection set data definitions.
 */
export interface SetDefinition {
  readonly id: string;
  readonly name: string;
  readonly theme: string;
  readonly itemIds: readonly string[];
  readonly completionReward: string;
}

export const SETS: readonly SetDefinition[] = [
  {
    id: 'neon-cats',
    name: 'Neon Cats',
    theme: 'Alley cats, late trains, and glowing shop signs.',
    itemIds: ['neon-cat-nap', 'neon-cat-vending', 'neon-cat-ticket', 'neon-cat-static'],
    completionReward: 'A glowing cat poster appears above the PC.',
  },
  {
    id: 'retro-robots',
    name: 'Retro Robots',
    theme: 'Tiny machine helpers with outdated but sincere firmware.',
    itemIds: ['robot-bento', 'robot-tape', 'robot-bulb', 'robot-coin'],
    completionReward: 'A toy robot begins blinking on the desk shelf.',
  },
  {
    id: 'forest-spirits',
    name: 'Forest Spirits',
    theme: 'Small guardians that have moved into the store vents.',
    itemIds: ['spirit-moss', 'spirit-lantern', 'spirit-umbrella', 'spirit-shelf-door'],
    completionReward: 'A mossy charm hangs from the bedroom window latch.',
  },
  {
    id: 'midnight-trains',
    name: 'Midnight Trains',
    theme: 'Miniature routes that only run after the last customer leaves.',
    itemIds: ['train-local', 'train-ticket', 'train-platform', 'train-ghostline'],
    completionReward: 'A little platform sign clicks to 03:07.',
  },
  {
    id: 'seasonal-snacks',
    name: 'Seasonal Snacks',
    theme: 'Convenience-store comforts for a long night shift.',
    itemIds: ['snack-melon', 'snack-soda', 'snack-taiyaki', 'snack-moon-dango'],
    completionReward: 'A tiny snack tray appears beside the keyboard.',
  },
  {
    id: 'staff-only',
    name: 'Staff Only',
    theme: 'Capsules from a machine that should not fit behind the shelf.',
    itemIds: ['staff-key', 'staff-point-card', 'staff-mirror-capsule', 'staff-wonder-token'],
    completionReward: 'The bedroom door gains a second, smaller handle.',
  },
];

export function getSetById(setId: string): SetDefinition {
  const set = SETS.find((definition) => definition.id === setId);
  if (!set) {
    throw new Error(`Unknown set id: ${setId}`);
  }

  return set;
}
