/**
 * PON — Data Type Contracts
 *
 * Central type definitions for all game entities.
 * These types are the backbone of system logic and data modules.
 */

// ————————————————————————————————
// Rarity
// ————————————————————————————————

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// ————————————————————————————————
// Items & Sets
// ————————————————————————————————

export interface Item {
  id: string;
  name: string;
  rarity: Rarity;
  setId: string;
  flavorText: string;
  iconKey: string;
  /** e.g. ['time-locked'], ['hidden-machine'] */
  tags: string[];
}

export interface ItemSet {
  id: string;
  name: string;
  theme: string;
  itemIds: string[];
  completionReward: string;
}

// ————————————————————————————————
// Machines
// ————————————————————————————————

export interface MachineDefinition {
  id: string;
  name: string;
  position: [number, number, number];
  /** Y-axis rotation in radians */
  rotation: number;
  itemPoolIds: string[];
  rarityWeights: Record<Rarity, number>;
  /** 1–5 scale of maintenance difficulty */
  maintenanceDifficulty: number;
  /** e.g. ['generous-when-clean', 'jams-often'] */
  quirks: string[];
  unlockCondition?: UnlockCondition;
}

export interface MachineState {
  machineId: string;
  cleanliness: 'clean' | 'dirty';
  stockLevel: 'ok' | 'low' | 'empty';
  isJammed: boolean;
  isPowered: boolean;
}

// ————————————————————————————————
// Tasks
// ————————————————————————————————

export type TaskType =
  | 'clean_floor'
  | 'wipe_glass'
  | 'restock'
  | 'fix_jam'
  | 'rewire';

export interface TaskTemplate {
  id: string;
  type: TaskType;
  description: string;
  /** Money earned on completion */
  baseReward: number;
  /** In-game minutes consumed */
  timeCost: number;
  targetType: 'floor' | 'machine';
}

export interface ActiveTask {
  templateId: string;
  targetId: string;
  isCompleted: boolean;
}

// ————————————————————————————————
// Progression
// ————————————————————————————————

export interface NightProgressionStep {
  night: number;
  taskCount: [min: number, max: number];
  availableMachineIds: string[];
  unlocks: string[];
  difficultyModifier: number;
}

export interface UnlockCondition {
  type:
    | 'nights_worked'
    | 'sets_completed'
    | 'items_owned'
    | 'secret_triggered';
  threshold: number;
  unlocks: string;
}

// ————————————————————————————————
// Game State (Save)
// ————————————————————————————————

export interface GameState {
  version: number;
  nightsWorked: number;
  money: number;
  tokens: number;
  ownedItemIds: string[];
  secretsTriggered: string[];
  settings: PlayerSettings;
}

export interface PlayerSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  mouseSensitivity: number;
  invertY: boolean;
}

// ————————————————————————————————
// Scene Interface
// ————————————————————————————————

export interface Scene {
  /** Called once when the scene is entered; may async-load assets */
  init(): Promise<void> | void;
  /** Called every frame with delta time in seconds */
  update(dt: number): void;
  /** Clean up Three.js objects, DOM listeners, and systems */
  dispose(): void;
}
