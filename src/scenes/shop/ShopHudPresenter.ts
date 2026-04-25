import { TASK_TEMPLATES } from '../../data/tasks.js';
import type { ActiveTask, MachineDefinition } from '../../data/types.js';
import {
  renderTaskList,
  updateClock,
  updateMoney,
  updateTimeBar,
  updateTokens,
} from '../../ui/shopHUD.js';

export class ShopHudPresenter {
  syncHud(
    money: number,
    tokens: number,
    formattedTime: string,
    nightProgress: number,
  ) {
    updateMoney(money);
    updateTokens(tokens);
    updateClock(formattedTime);
    updateTimeBar(nightProgress);
  }

  updateTime(formattedTime: string, nightProgress: number) {
    updateClock(formattedTime);
    updateTimeBar(nightProgress);
  }

  renderTasks(
    tasks: readonly ActiveTask[],
    availableMachines: readonly MachineDefinition[],
  ) {
    const taskData = tasks.map((t) => {
      const template = TASK_TEMPLATES.find((tt) => tt.id === t.templateId);
      const machine = availableMachines.find((m) => m.id === t.targetId);

      let description = template?.description ?? 'Unknown task';
      if (template?.targetType === 'floor') {
        description = 'Scrub mud splash until clean';
      } else if (machine) {
        description = `${template?.description ?? 'Service machine'} - ${machine.name}`;
      } else if (t.targetId === 'token-station') {
        description = `${template?.description ?? 'Service terminal'} - Token Terminal`;
      }

      return {
        description,
        isCompleted: t.isCompleted,
      };
    });

    renderTaskList(taskData);
  }
}
