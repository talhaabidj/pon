import type { Game } from '../core/Game.js';
import type { GameState } from '../data/types.js';
import type { CollectionSystem } from '../systems/CollectionSystem.js';
import type { EconomySystem } from '../systems/EconomySystem.js';
import type { ProgressionSystem } from '../systems/ProgressionSystem.js';

export interface SceneRouter {
  warmShopRoute: () => Promise<void>;
  toDesktop: (game: Game) => Promise<void>;
  toBedroom: (
    game: Game,
    gameState?: GameState,
    options?: { showStartGateOnLoad?: boolean },
  ) => Promise<void>;
  toShop: (
    game: Game,
    economy: EconomySystem,
    collection: CollectionSystem,
    progression: ProgressionSystem,
    totalMoneyEarned: number,
  ) => Promise<void>;
}

let sceneRouter: SceneRouter | null = null;

export function configureSceneRouter(nextRouter: SceneRouter) {
  sceneRouter = nextRouter;
}

export function getSceneRouter(): SceneRouter {
  if (!sceneRouter) {
    throw new Error(
      'Scene router is not configured. BootScene must run before scene transitions.',
    );
  }
  return sceneRouter;
}
