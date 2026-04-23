/**
 * TaskSystem unit tests.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TaskSystem } from '../../src/systems/TaskSystem.js';
import type { MachineState } from '../../src/data/types.js';

describe('TaskSystem', () => {
  let tasks: TaskSystem;
  const machineIds = ['machine-neko', 'machine-train', 'machine-moon'];

  beforeEach(() => {
    tasks = new TaskSystem();
  });

  it('generates the requested number of tasks', () => {
    const generated = tasks.generateTasks(5, machineIds, () => 0.5);
    expect(generated.length).toBe(5);
    expect(tasks.getTotalCount()).toBe(5);
  });

  it('all generated tasks start as uncompleted', () => {
    tasks.generateTasks(3, machineIds, () => 0.5);
    expect(tasks.getCompletedCount()).toBe(0);
    expect(tasks.isAllCompleted()).toBe(false);
  });

  it('completes a task by index', () => {
    tasks.generateTasks(3, machineIds, () => 0.5);
    const result = tasks.completeTask(0);
    expect(result).toBe(true);
    expect(tasks.getCompletedCount()).toBe(1);
  });

  it('cannot complete an already-completed task', () => {
    tasks.generateTasks(3, machineIds, () => 0.5);
    tasks.completeTask(0);
    const result = tasks.completeTask(0);
    expect(result).toBe(false);
  });

  it('cannot complete out-of-range index', () => {
    tasks.generateTasks(3, machineIds, () => 0.5);
    expect(tasks.completeTask(99)).toBe(false);
  });

  it('detects when all tasks are completed', () => {
    tasks.generateTasks(2, machineIds, () => 0.5);
    tasks.completeTask(0);
    tasks.completeTask(1);
    expect(tasks.isAllCompleted()).toBe(true);
  });

  it('detects quota met (at least half)', () => {
    tasks.generateTasks(4, machineIds, () => 0.5);
    tasks.completeTask(0);
    expect(tasks.isQuotaMet()).toBe(false);
    tasks.completeTask(1);
    expect(tasks.isQuotaMet()).toBe(true);
  });

  it('getTaskReward returns correct value', () => {
    expect(tasks.getTaskReward('task-clean-floor')).toBe(14);
    expect(tasks.getTaskReward('task-rewire')).toBe(30);
    expect(tasks.getTaskReward('nonexistent')).toBe(0);
  });

  it('getTaskTimeCost returns correct value', () => {
    expect(tasks.getTaskTimeCost('task-clean-floor')).toBe(10);
    expect(tasks.getTaskTimeCost('task-fix-jam')).toBe(18);
  });

  it('reset clears all tasks', () => {
    tasks.generateTasks(3, machineIds, () => 0.5);
    tasks.reset();
    expect(tasks.getTotalCount()).toBe(0);
  });

  it('generates a mix of floor and machine tasks', () => {
    // Use RNG that alternates to force variety
    let i = 0;
    const rng = () => {
      i++;
      return (i % 5) * 0.2; // 0, 0.2, 0.4, 0.6, 0.8
    };

    tasks.generateTasks(10, machineIds, rng);
    const allTasks = tasks.getTasks();
    expect(allTasks.length).toBe(10);

    // Should have at least one floor task (when rng < 0.3)
    const floorTasks = allTasks.filter((t) =>
      t.targetId.startsWith('floor-spot'),
    );
    expect(floorTasks.length).toBeGreaterThan(0);
  });

  it('prioritizes critical machine blockers when slots are limited', () => {
    const machineStates = new Map<string, MachineState>([
      ['machine-neko', {
        machineId: 'machine-neko',
        cleanliness: 'clean',
        stockLevel: 'ok',
        isJammed: true,
        isPowered: true,
      }],
      ['machine-train', {
        machineId: 'machine-train',
        cleanliness: 'clean',
        stockLevel: 'empty',
        isJammed: false,
        isPowered: true,
      }],
      ['machine-moon', {
        machineId: 'machine-moon',
        cleanliness: 'dirty',
        stockLevel: 'ok',
        isJammed: false,
        isPowered: false,
      }],
    ]);

    const generated = tasks.generateTasksFromMaintenance(2, machineStates, () => 0.5);
    expect(generated.length).toBe(2);

    const criticalTemplateIds = new Set(['task-fix-jam', 'task-restock', 'task-rewire']);
    generated.forEach((task) => {
      expect(criticalTemplateIds.has(task.templateId)).toBe(true);
    });
  });

  it('includes empty-stock restock as a critical task candidate', () => {
    const machineStates = new Map<string, MachineState>([
      ['machine-neko', {
        machineId: 'machine-neko',
        cleanliness: 'clean',
        stockLevel: 'empty',
        isJammed: false,
        isPowered: true,
      }],
      ['machine-train', {
        machineId: 'machine-train',
        cleanliness: 'dirty',
        stockLevel: 'ok',
        isJammed: false,
        isPowered: true,
      }],
    ]);

    const generated = tasks.generateTasksFromMaintenance(1, machineStates, () => 0.5);
    expect(generated.length).toBe(1);
    expect(generated[0]?.templateId).toBe('task-restock');
    expect(generated[0]?.targetId).toBe('machine-neko');
  });
});
