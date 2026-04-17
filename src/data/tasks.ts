/**
 * Shift task templates.
 */
import type { TaskType } from '../systems/TaskSystem';

export interface TaskTemplate {
  readonly id: string;
  readonly type: TaskType;
  readonly baseReward: number;
}

export const TASK_TEMPLATES: readonly TaskTemplate[] = [];
