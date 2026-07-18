import Phaser from 'phaser';
import { registerSW } from 'virtual:pwa-register';
import { CoarseKeyboardFallbackController } from './game/CoarseKeyboardFallbackController';
import { gameConfig } from './game/config';
import { InventoryUiController } from './game/InventoryUiController';
import { ReputationController } from './game/ReputationController';
import { StealthController } from './game/StealthController';
import './styles/main.css';
import './styles/reputation.css';

registerSW({ immediate: true });

const game = new Phaser.Game(gameConfig);
const inventoryUi = new InventoryUiController(game);
const reputationController = new ReputationController();
const stealthController = new StealthController(game);
const coarseKeyboardFallback = new CoarseKeyboardFallbackController();

window.addEventListener('pagehide', () => {
  coarseKeyboardFallback.destroy();
  stealthController.destroy();
  reputationController.destroy();
  inventoryUi.destroy();
  game.destroy(true);
});
