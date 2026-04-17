/**
 * Base machine view model for future shop interactions.
 */
import { Group } from 'three';

export interface GachaMachineView {
  readonly machineId: string;
  readonly root: Group;
}

export function createBaseGachaMachine(machineId: string): GachaMachineView {
  return {
    machineId,
    root: new Group(),
  };
}
