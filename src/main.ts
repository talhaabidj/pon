import { Game } from './core/Game';
import './styles.css';

const gameRoot = document.querySelector<HTMLElement>('#game-root');
const uiRoot = document.querySelector<HTMLElement>('#ui-root');

if (!gameRoot || !uiRoot) {
  throw new Error('PON could not find #game-root and #ui-root.');
}

const game = new Game(gameRoot, uiRoot);
game.start();
