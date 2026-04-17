/**
 * Versioned localStorage save boundary for serializable game state.
 */
const SAVE_KEY = 'pon.save.v1';

export interface SaveData {
  readonly version: 1;
  readonly night: number;
  readonly money: number;
  readonly tokens: number;
  readonly collectedItemIds: readonly string[];
  readonly shiftLog: readonly string[];
}

export const DEFAULT_SAVE_DATA: SaveData = {
  version: 1,
  night: 1,
  money: 0,
  tokens: 0,
  collectedItemIds: [],
  shiftLog: [],
};

export class SaveSystem {
  public load(): SaveData {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return DEFAULT_SAVE_DATA;
    }

    try {
      return { ...DEFAULT_SAVE_DATA, ...JSON.parse(raw), version: 1 };
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
