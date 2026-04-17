/**
 * Shift task generation and completion state.
 */
import { MACHINES, type MachineDefinition } from '../data/machines';
import { TASK_TEMPLATES, type TaskTemplate } from '../data/tasks';
import { createSeededRng } from '../core/Rng';
import type { MachineMaintenanceState, MachineState } from './MaintenanceSystem';

export type TaskType = 'clean_floor' | 'wipe_machine' | 'restock' | 'fix_jam' | 'rewire_machine';

export interface TaskInstance {
  readonly id: string;
  readonly type: TaskType;
  readonly label: string;
  readonly targetMachineId: string;
  readonly targetName: string;
  readonly reward: number;
  readonly minutes: number;
  readonly problemState: MachineMaintenanceState;
  readonly completed: boolean;
}

export class TaskSystem {
  private readonly tasks = new Map<string, TaskInstance>();

  public constructor(
    private readonly templates: readonly TaskTemplate[] = TASK_TEMPLATES,
    private readonly machines: readonly MachineDefinition[] = MACHINES,
  ) {}

  public generateNightTasks(
    night: number,
    unlockedMachineIds: readonly string[],
    count: number,
    seed: string | number,
  ): readonly TaskInstance[] {
    this.tasks.clear();

    const rng = createSeededRng(`${seed}:${night}:tasks`);
    const unlockedMachines = this.machines.filter((machine) =>
      unlockedMachineIds.includes(machine.id),
    );
    const fallbackMachines =
      unlockedMachines.length > 0 ? unlockedMachines : this.machines.slice(0, 1);

    for (let index = 0; index < count; index += 1) {
      const template = this.templates[Math.floor(rng() * this.templates.length)];
      const machine = fallbackMachines[Math.floor(rng() * fallbackMachines.length)];
      const task = this.createTask(template, machine, night, index);
      this.tasks.set(task.id, task);
    }

    return this.getTasks();
  }

  public addTask(task: TaskInstance): void {
    this.tasks.set(task.id, task);
  }

  public completeTask(taskId: string): TaskInstance {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Unknown task id: ${taskId}`);
    }

    const completedTask = { ...task, completed: true };
    this.tasks.set(taskId, completedTask);
    return completedTask;
  }

  public getTask(taskId: string): TaskInstance | undefined {
    return this.tasks.get(taskId);
  }

  public getTasks(): readonly TaskInstance[] {
    return [...this.tasks.values()];
  }

  public getCompletedCount(): number {
    return this.getTasks().filter((task) => task.completed).length;
  }

  public getTotalCount(): number {
    return this.tasks.size;
  }

  public getProblemStates(): readonly MachineState[] {
    return this.getTasks().map((task) => ({
      machineId: task.targetMachineId,
      dirty: task.problemState === 'dirty',
      lowStock: task.problemState === 'lowStock',
      jammed: task.problemState === 'jammed',
      powered: task.problemState !== 'offline',
    }));
  }

  private createTask(
    template: TaskTemplate,
    machine: MachineDefinition,
    night: number,
    index: number,
  ): TaskInstance {
    return {
      id: `night-${night}-${template.type}-${index}`,
      type: template.type,
      label: `${template.label}: ${machine.seriesName}`,
      targetMachineId: machine.id,
      targetName: machine.displayName,
      reward: template.baseReward + machine.maintenanceDifficulty * 15,
      minutes: template.minutes + machine.maintenanceDifficulty * 3,
      problemState: this.getProblemState(template.type),
      completed: false,
    };
  }

  private getProblemState(type: TaskType): MachineMaintenanceState {
    switch (type) {
      case 'clean_floor':
      case 'wipe_machine':
        return 'dirty';
      case 'restock':
        return 'lowStock';
      case 'fix_jam':
        return 'jammed';
      case 'rewire_machine':
        return 'offline';
    }
  }
}
