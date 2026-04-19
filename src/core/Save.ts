/**
 * Save — localStorage persistence for game state.
 *
 * Encodes/decodes a GameState object with versioning.
 */

import type { GameState } from '../data/types.js';
import { SAVE_KEY, DEFAULT_SETTINGS } from '../core/Config.js';

const CURRENT_VERSION = 1;

/** Create a fresh game state */
export function createDefaultGameState(): GameState {
  return {
    version: CURRENT_VERSION,
    nightsWorked: 0,
    money: 0,
    totalMoneyEarned: 0,
    tokens: 0,
    ownedItemIds: [],
    secretsTriggered: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

/** Load game state from localStorage. Returns null if no save exists or is corrupt. */
export function loadGameState(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<GameState>;

    // Version check
    if (parsed.version !== CURRENT_VERSION) {
      // Future: handle migration
      console.warn('Save version mismatch, starting fresh');
      return null;
    }

    // Backward-compatible migration for older saves that predate totalMoneyEarned.
    return {
      version: CURRENT_VERSION,
      nightsWorked: parsed.nightsWorked ?? 0,
      money: parsed.money ?? 0,
      totalMoneyEarned: parsed.totalMoneyEarned ?? parsed.money ?? 0,
      tokens: parsed.tokens ?? 0,
      ownedItemIds: parsed.ownedItemIds ?? [],
      secretsTriggered: parsed.secretsTriggered ?? [],
      settings: {
        ...DEFAULT_SETTINGS,
        ...(parsed.settings ?? {}),
      },
    };
  } catch {
    console.warn('Failed to load save, starting fresh');
    return null;
  }
}

/** Save game state to localStorage */
export function saveGameState(state: GameState): boolean {
  try {
    state.version = CURRENT_VERSION;
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    console.error('Failed to save game state');
    return false;
  }
}

/** Delete the save */
export function deleteSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

/** Check if a save exists */
export function hasSave(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null;
}
