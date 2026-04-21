/**
 * main.ts — Catchapon entry point.
 *
 * Initializes the Game instance and boots into the first scene.
 */

import { Game } from './core/Game.js';
import { BootScene } from './scenes/BootScene.js';
import './styles/desktop.css';
import './styles/bedroom.css';
import './styles/shop.css';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';

async function main() {
  RectAreaLightUniformsLib.init();
  const container = document.getElementById('canvas-container');
  if (!container) {
    throw new Error('Missing #canvas-container element in index.html');
  }

  const game = new Game(container);
  game.start();

  // Boot into the loading / desktop flow
  await game.sceneManager.switchTo(new BootScene(game));
}

main().catch((err) => {
  console.error('Catchapon failed to start:', err);
});
