import Phaser from 'phaser';
import { registerSW } from 'virtual:pwa-register';
import { gameConfig } from './game/config';
import { InventoryUiController } from './game/InventoryUiController';
import './styles/main.css';

registerSW({ immediate: true });

const game = new Phaser.Game(gameConfig);
const inventoryUi = new InventoryUiController(game);

window.addEventListener('pagehide', () => {
  inventoryUi.destroy();
  game.destroy(true);
});
