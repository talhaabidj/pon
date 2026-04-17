/**
 * Shift task templates.
 */
import type { TaskType } from '../systems/TaskSystem';

export interface TaskTemplate {
  readonly id: string;
  readonly type: TaskType;
  readonly label: string;
  readonly baseReward: number;
  readonly minutes: number;
}

export const TASK_TEMPLATES: readonly TaskTemplate[] = [
  {
    id: 'clean-floor',
    type: 'clean_floor',
    label: 'Mop the capsule trail near the aisle marker',
    baseReward: 120,
    minutes: 22,
  },
  {
    id: 'wipe-lens',
    type: 'wipe_machine',
    label: 'Wipe the acrylic lens until it stops clouding',
    baseReward: 90,
    minutes: 16,
  },
  {
    id: 'restock-capsules',
    type: 'restock',
    label: 'Restock a low capsule bin from the back crate',
    baseReward: 140,
    minutes: 28,
  },
  {
    id: 'fix-jam',
    type: 'fix_jam',
    label: 'Free a capsule jam without cracking the shell',
    baseReward: 170,
    minutes: 34,
  },
  {
    id: 'rewire-plug',
    type: 'rewire_machine',
    label: 'Reconnect a humming machine with the safe voltage pattern',
    baseReward: 210,
    minutes: 42,
  },
];
