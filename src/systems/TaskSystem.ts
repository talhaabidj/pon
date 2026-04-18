/**
 * TaskSystem — Generates and tracks nightly maintenance tasks.
 *
 * Uses task templates and progression to create varied work each night.
 */

import type { TaskTemplate, ActiveTask } from '../data/types.js';
import { TASK_TEMPLATES } from '../data/tasks.js';

export class TaskSystem {
  private activeTasks: ActiveTask[] = [];

  /**
   * Generate tasks for a night.
   *
   * @param count - Number of tasks to generate
   * @param availableMachineIds - Machines available this night
   * @param rng - Optional RNG for testing
   */
  generateTasks(
    count: number,
    availableMachineIds: string[],
    rng: () => number = Math.random,
  ): ActiveTask[] {
    this.activeTasks = [];

    const floorTaskTemplates = TASK_TEMPLATES.filter(
      (t) => t.targetType === 'floor',
    );
    const machineTaskTemplates = TASK_TEMPLATES.filter(
      (t) => t.targetType === 'machine',
    );

    for (let i = 0; i < count; i++) {
      // Mix of floor and machine tasks (~30% floor, ~70% machine)
      const isFloorTask = rng() < 0.3 && floorTaskTemplates.length > 0;

      let template: TaskTemplate;
      let targetId: string;

      if (isFloorTask) {
        const idx = Math.floor(rng() * floorTaskTemplates.length);
        template = floorTaskTemplates[idx]!;
        targetId = `floor-spot-${i}`;
      } else {
        const idx = Math.floor(rng() * machineTaskTemplates.length);
        template = machineTaskTemplates[idx]!;
        // Assign to a random available machine
        const machineIdx = Math.floor(rng() * availableMachineIds.length);
        targetId = availableMachineIds[machineIdx] ?? 'machine-neko';
      }

      this.activeTasks.push({
        templateId: template.id,
        targetId,
        isCompleted: false,
      });
    }

    return [...this.activeTasks];
  }

  /** Mark a task as completed by index */
  completeTask(index: number): boolean {
    const task = this.activeTasks[index];
    if (!task || task.isCompleted) return false;
    task.isCompleted = true;
    return true;
  }

  /** Get all active tasks */
  getTasks(): readonly ActiveTask[] {
    return this.activeTasks;
  }

  /** Get count of completed tasks */
  getCompletedCount(): number {
    return this.activeTasks.filter((t) => t.isCompleted).length;
  }

  /** Get total task count */
  getTotalCount(): number {
    return this.activeTasks.length;
  }

  /** Check if all tasks are completed */
  isAllCompleted(): boolean {
    return (
      this.activeTasks.length > 0 &&
      this.activeTasks.every((t) => t.isCompleted)
    );
  }

  /** Check if minimum quota is met (at least half) */
  isQuotaMet(): boolean {
    const half = Math.ceil(this.activeTasks.length / 2);
    return this.getCompletedCount() >= half;
  }

  /** Get the reward for a task template */
  getTaskReward(templateId: string): number {
    const template = TASK_TEMPLATES.find((t) => t.id === templateId);
    return template?.baseReward ?? 0;
  }

  /** Get time cost for a task template */
  getTaskTimeCost(templateId: string): number {
    const template = TASK_TEMPLATES.find((t) => t.id === templateId);
    return template?.timeCost ?? 10;
  }

  /** Reset for a new night */
  reset() {
    this.activeTasks = [];
  }
}
