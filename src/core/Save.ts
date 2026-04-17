/**
 * Versioned localStorage save boundary for serializable game state.
 */
const SAVE_KEY = 'pon.save.v1';

import type { MachineState } from '../systems/MaintenanceSystem';

export interface SaveSettings {
  readonly masterVolume: number;
  readonly mouseSensitivity: number;
  readonly invertY: boolean;
}

export interface SaveFlags {
  readonly hiddenMachineFound: boolean;
  readonly ghostlineHintSeen: boolean;
}

export interface SaveData {
  readonly version: 1;
  readonly night: number;
  readonly money: number;
  readonly tokens: number;
  readonly lifetimeMoney: number;
  readonly lifetimeTokensUsed: number;
  readonly collectedItemIds: readonly string[];
  readonly shiftLog: readonly string[];
  readonly machineStates: readonly MachineState[];
  readonly settings: SaveSettings;
  readonly flags: SaveFlags;
}

export const DEFAULT_SAVE_DATA: SaveData = {
  version: 1,
  night: 1,
  money: 0,
  tokens: 0,
  lifetimeMoney: 0,
  lifetimeTokensUsed: 0,
  collectedItemIds: [],
  shiftLog: [],
  machineStates: [],
  settings: {
    masterVolume: 0.8,
    mouseSensitivity: 1,
    invertY: false,
  },
  flags: {
    hiddenMachineFound: false,
    ghostlineHintSeen: false,
  },
};

export class SaveSystem {
  public load(): SaveData {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return DEFAULT_SAVE_DATA;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      return {
        ...DEFAULT_SAVE_DATA,
        ...parsed,
        version: 1,
        settings: { ...DEFAULT_SAVE_DATA.settings, ...parsed.settings },
        flags: { ...DEFAULT_SAVE_DATA.flags, ...parsed.flags },
      };
    } catch {
      return DEFAULT_SAVE_DATA;
    }
  }

  public save(data: SaveData): void {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }

  public clear(): void {
    window.localStorage.removeItem(SAVE_KEY);
  }
}
