import type { ActiveTask, MachineDefinition, MachineState } from '../../data/types.js';
import { getAvailableMachines } from '../../data/machines.js';
import type { MaintenanceSystem } from '../../systems/MaintenanceSystem.js';
import type { ProgressionSystem } from '../../systems/ProgressionSystem.js';
import type { TaskSystem } from '../../systems/TaskSystem.js';
import { buildShopFloor, type ShopLayout } from '../../world/ShopFloor.js';
import { getNightlyBlockingIssueBudget } from './BlockingIssueBudget.js';
import { reduceBlockingIssuesToBudget } from './ServiceStateBalancer.js';
import {
  createTokenStationState,
  ensureTokenStationIssueTask,
} from './TokenStationFlow.js';

export interface ShopRuntimeContext {
  availableMachines: MachineDefinition[];
  curatedTasks: readonly ActiveTask[];
  tokenStationState: MachineState;
  layout: ShopLayout;
}

export interface ShopRuntimeContextInput {
  progression: ProgressionSystem;
  maintenance: MaintenanceSystem;
  tasks: TaskSystem;
}

export function createShopRuntimeContext(
  input: ShopRuntimeContextInput,
): ShopRuntimeContext {
  const prog = input.progression.getCurrentProgression();
  const nightsWorked = input.progression.getNightsWorked();

  const availableMachines = getAvailableMachines(nightsWorked);
  const machineIds = availableMachines.map((machine) => machine.id);

  input.maintenance.initializeForNight(machineIds, prog.difficultyModifier);

  const tokenStationState = createTokenStationState(prog.difficultyModifier);
  tokenStationState.isPowered = true;
  if (tokenStationState.stockLevel === 'empty') {
    tokenStationState.stockLevel = 'low';
  }

  const [minTasks, maxTasks] = prog.taskCount;
  const taskCount =
    minTasks + Math.floor(Math.random() * (maxTasks - minTasks + 1));

  const stateMap = new Map<string, MachineState>();
  for (const id of machineIds) {
    const state = input.maintenance.getState(id);
    if (state) stateMap.set(id, state);
  }
  stateMap.set('token-station', tokenStationState);

  const maxBlockingIssues = getNightlyBlockingIssueBudget(stateMap.size);
  reduceBlockingIssuesToBudget([...stateMap.values()], maxBlockingIssues);

  const activeTasks = input.tasks.generateTasksFromMaintenance(taskCount, stateMap);
  const curatedTasks = ensureTokenStationIssueTask(
    activeTasks,
    taskCount,
    tokenStationState,
  );
  input.tasks.setTasks(curatedTasks);

  const layout = buildShopFloor(availableMachines, stateMap);

  return {
    availableMachines,
    curatedTasks,
    tokenStationState,
    layout,
  };
}
