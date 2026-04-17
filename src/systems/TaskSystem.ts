/**
 * Shift task generation and completion state.
 */
export type TaskType = 'clean_floor' | 'wipe_machine' | 'restock' | 'fix_jam' | 'rewire_machine';

export interface TaskInstance {
  readonly id: string;
  readonly type: TaskType;
  readonly reward: number;
  readonly completed: boolean;
}

export class TaskSystem {
  private readonly tasks = new Map<string, TaskInstance>();

  public addTask(task: TaskInstance): void {
    this.tasks.set(task.id, task);
  }

  public getTasks(): readonly TaskInstance[] {
    return [...this.tasks.values()];
  }
}
