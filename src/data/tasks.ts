/**
 * tasks.ts — Task template definitions.
 *
 * 5 task types used by TaskSystem to generate nightly work.
 */

import type { TaskTemplate } from './types.js';

export const TASK_TEMPLATES: readonly TaskTemplate[] = [
  {
    id: 'task-clean-floor',
    type: 'clean_floor',
    description: 'Mop a dirty floor spot',
    baseReward: 60,
    timeCost: 10,
    targetType: 'floor',
  },
  {
    id: 'task-wipe-glass',
    type: 'wipe_glass',
    description: 'Wipe machine glass clean',
    baseReward: 50,
    timeCost: 8,
    targetType: 'machine',
  },
  {
    id: 'task-restock',
    type: 'restock',
    description: 'Restock capsules from storage crate',
    baseReward: 80,
    timeCost: 15,
    targetType: 'machine',
  },
  {
    id: 'task-fix-jam',
    type: 'fix_jam',
    description: 'Fix a jammed capsule mechanism',
    baseReward: 100,
    timeCost: 18,
    targetType: 'machine',
  },
  {
    id: 'task-rewire',
    type: 'rewire',
    description: 'Reconnect a disconnected machine plug',
    baseReward: 120,
    timeCost: 20,
    targetType: 'machine',
  },
] as const;

/** Lookup template by ID */
export function getTaskTemplateById(id: string): TaskTemplate | undefined {
  return TASK_TEMPLATES.find((t) => t.id === id);
}

/** Get task templates by type */
export function getTaskTemplatesByType(type: string): TaskTemplate[] {
  return TASK_TEMPLATES.filter((t) => t.type === type);
}
