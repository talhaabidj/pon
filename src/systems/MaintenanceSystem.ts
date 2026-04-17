/**
 * Tracks machine maintenance state independently from rendered machine meshes.
 */
export type MachineMaintenanceState = 'ready' | 'dirty' | 'lowStock' | 'jammed' | 'offline';

export class MaintenanceSystem {
  private readonly states = new Map<string, MachineMaintenanceState>();

  public setState(machineId: string, state: MachineMaintenanceState): void {
    this.states.set(machineId, state);
  }

  public getState(machineId: string): MachineMaintenanceState {
    return this.states.get(machineId) ?? 'ready';
  }
}
