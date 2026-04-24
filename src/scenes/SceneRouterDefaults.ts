import type { Game } from '../core/Game.js';
import type { GameState, Scene } from '../data/types.js';
import type { CollectionSystem } from '../systems/CollectionSystem.js';
import type { EconomySystem } from '../systems/EconomySystem.js';
import type { ProgressionSystem } from '../systems/ProgressionSystem.js';
import type { SceneRouter } from './SceneRouter.js';

type DesktopSceneConstructor = new (game: Game) => Scene;
type BedroomSceneConstructor = new (
  game: Game,
  gameState?: GameState,
  options?: { showStartGateOnLoad?: boolean },
) => Scene;
type ShopSceneConstructor = new (
  game: Game,
  economy?: EconomySystem,
  collection?: CollectionSystem,
  progression?: ProgressionSystem,
  totalMoneyEarned?: number,
) => Scene;

let desktopModulePromise: Promise<{ DesktopScene: DesktopSceneConstructor }> | null = null;
let bedroomModulePromise: Promise<{ BedroomScene: BedroomSceneConstructor }> | null = null;
let shopModulePromise: Promise<{ ShopScene: ShopSceneConstructor }> | null = null;

function loadDesktopModule() {
  if (!desktopModulePromise) {
    desktopModulePromise = import('./DesktopScene.js');
  }
  return desktopModulePromise;
}

function loadBedroomModule() {
  if (!bedroomModulePromise) {
    bedroomModulePromise = import('./BedroomScene.js');
  }
  return bedroomModulePromise;
}

function loadShopModule() {
  if (!shopModulePromise) {
    shopModulePromise = import('./ShopScene.js');
  }
  return shopModulePromise;
}

export function createDefaultSceneRouter(): SceneRouter {
  return {
    warmShopRoute: async () => {
      await loadShopModule();
    },
    toDesktop: async (game: Game) => {
      const { DesktopScene } = await loadDesktopModule();
      await game.sceneManager.switchTo(new DesktopScene(game));
    },
    toBedroom: async (
      game: Game,
      gameState?: GameState,
      options?: { showStartGateOnLoad?: boolean },
    ) => {
      const { BedroomScene } = await loadBedroomModule();
      await game.sceneManager.switchTo(new BedroomScene(game, gameState, options));
    },
    toShop: async (
      game: Game,
      economy: EconomySystem,
      collection: CollectionSystem,
      progression: ProgressionSystem,
      totalMoneyEarned: number,
    ) => {
      const { ShopScene } = await loadShopModule();
      await game.sceneManager.switchTo(
        new ShopScene(
          game,
          economy,
          collection,
          progression,
          totalMoneyEarned,
        ),
      );
    },
  };
}
