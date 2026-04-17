/**
 * Deterministic capsule pull logic. Scenes ask this system for results; Three.js only reveals them.
 */
import { ITEMS, type ItemDefinition, type Rarity } from '../data/items';
import { MACHINES, getMachineById, type MachineDefinition } from '../data/machines';
import { createSeededRng, pickWeighted, type Rng } from '../core/Rng';

export interface CapsulePullResult {
  readonly itemId: string;
  readonly item: ItemDefinition;
  readonly machineId: string;
  readonly machineName: string;
  readonly rarity: Rarity;
  readonly isNew: boolean;
  readonly seed: string;
}

export class CapsuleSystem {
  public constructor(
    private readonly items: readonly ItemDefinition[] = ITEMS,
    private readonly machines: readonly MachineDefinition[] = MACHINES,
  ) {}

  public pull(
    machineId: string,
    seed: string | number,
    ownedItemIds: readonly string[] = [],
  ): CapsulePullResult {
    const machine = this.findMachine(machineId);
    const rng = createSeededRng(seed);
    const rarity = this.pickAvailableRarity(machine, rng);
    const candidates = this.getCandidateItems(machine, rarity);
    const item = candidates[Math.floor(rng() * candidates.length)];

    return {
      itemId: item.id,
      item,
      machineId: machine.id,
      machineName: machine.displayName,
      rarity: item.rarity,
      isNew: !ownedItemIds.includes(item.id),
      seed: String(seed),
    };
  }

  public getMachine(machineId: string): MachineDefinition {
    return this.findMachine(machineId);
  }

  private findMachine(machineId: string): MachineDefinition {
    const machine = this.machines.find((definition) => definition.id === machineId);
    if (!machine) {
      return getMachineById(machineId);
    }

    return machine;
  }

  private pickAvailableRarity(machine: MachineDefinition, rng: Rng): Rarity {
    const fallbackOrder: readonly Rarity[] = ['common', 'uncommon', 'rare', 'secret'];

    for (let attempt = 0; attempt < fallbackOrder.length; attempt += 1) {
      const rarity = pickWeighted(machine.rarityWeights, rng);
      if (this.getCandidateItems(machine, rarity).length > 0) {
        return rarity;
      }
    }

    return (
      fallbackOrder.find((rarity) => this.getCandidateItems(machine, rarity).length > 0) ?? 'common'
    );
  }

  private getCandidateItems(machine: MachineDefinition, rarity: Rarity): readonly ItemDefinition[] {
    return this.items.filter((item) => machine.itemIds.includes(item.id) && item.rarity === rarity);
  }
}
