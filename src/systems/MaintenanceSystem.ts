/**
 * Tracks machine maintenance state independently from rendered machine meshes.
 */
import { MACHINES } from '../data/machines';

export interface MachineState {
  readonly machineId: string;
  readonly dirty: boolean;
  readonly lowStock: boolean;
  readonly jammed: boolean;
  readonly powered: boolean;
}

export type MachineMaintenanceState = 'ready' | 'dirty' | 'lowStock' | 'jammed' | 'offline';

export class MaintenanceSystem {
  private readonly states = new Map<string, MachineState>();

  public constructor(initialStates: readonly MachineState[] = []) {
    for (const machine of MACHINES) {
      this.states.set(machine.id, {
        machineId: machine.id,
        dirty: false,
        lowStock: false,
        jammed: false,
        powered: true,
      });
    }

    for (const state of initialStates) {
      this.states.set(state.machineId, state);
    }
  }

  public setState(machineId: string, state: MachineMaintenanceState): void {
    const current = this.getMachineState(machineId);
    this.states.set(machineId, {
      machineId,
      dirty: state === 'dirty' || current.dirty,
      lowStock: state === 'lowStock' || current.lowStock,
      jammed: state === 'jammed' || current.jammed,
      powered: state === 'offline' ? false : current.powered,
    });
  }

  public getState(machineId: string): MachineMaintenanceState {
    const state = this.getMachineState(machineId);
    if (!state.powered) {
      return 'offline';
    }
    if (state.jammed) {
      return 'jammed';
    }
    if (state.lowStock) {
      return 'lowStock';
    }
    if (state.dirty) {
      return 'dirty';
    }

    return 'ready';
  }

  public getMachineState(machineId: string): MachineState {
    return (
      this.states.get(machineId) ?? {
        machineId,
        dirty: false,
        lowStock: false,
        jammed: false,
        powered: true,
      }
    );
  }

  public markCleaned(machineId: string): void {
    const state = this.getMachineState(machineId);
    this.states.set(machineId, { ...state, dirty: false });
  }

  public markRestocked(machineId: string): void {
    const state = this.getMachineState(machineId);
    this.states.set(machineId, { ...state, lowStock: false });
  }

  public markFixed(machineId: string): void {
    const state = this.getMachineState(machineId);
    this.states.set(machineId, { ...state, jammed: false });
  }

  public markRewired(machineId: string): void {
    const state = this.getMachineState(machineId);
    this.states.set(machineId, { ...state, powered: true });
  }

  public applyTaskProblem(machineId: string, state: MachineMaintenanceState): void {
    const current = this.getMachineState(machineId);
    this.states.set(machineId, {
      machineId,
      dirty: current.dirty || state === 'dirty',
      lowStock: current.lowStock || state === 'lowStock',
      jammed: current.jammed || state === 'jammed',
      powered: state === 'offline' ? false : current.powered,
    });
  }

  public completeTaskProblem(machineId: string, state: MachineMaintenanceState): void {
    if (state === 'dirty') {
      this.markCleaned(machineId);
    }
    if (state === 'lowStock') {
      this.markRestocked(machineId);
    }
    if (state === 'jammed') {
      this.markFixed(machineId);
    }
    if (state === 'offline') {
      this.markRewired(machineId);
    }
  }

  public toJSON(): readonly MachineState[] {
    return [...this.states.values()];
  }
}
