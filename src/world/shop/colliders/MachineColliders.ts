import type { MachineDefinition } from '../../../data/types.js';
import type { ShopCollider } from '../types.js';

const MACHINE_HALF_W = 0.48;
const MACHINE_HALF_D = 0.42;

export function createMachineCollider(def: MachineDefinition): ShopCollider {
  const rotated = Math.abs(def.rotation) % Math.PI > 0.01;
  return {
    name: `machine-${def.id}`,
    x: def.position[0],
    z: def.position[2],
    halfW: rotated ? MACHINE_HALF_D : MACHINE_HALF_W,
    halfD: rotated ? MACHINE_HALF_W : MACHINE_HALF_D,
  };
}
