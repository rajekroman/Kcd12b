import Phaser from 'phaser';
import { registerSW } from 'virtual:pwa-register';
import { AdaptiveAudioController } from './game/AdaptiveAudioController';
import { gameConfig } from './game/config';
import { InventoryUiController } from './game/InventoryUiController';
import { KeyboardInputFallbackController } from './game/KeyboardInputFallbackController';
import { ReputationController } from './game/ReputationController';
import { StealthController } from './game/StealthController';
import './styles/main.css';
import './styles/reputation.css';
import './styles/audio.css';

registerSW({ immediate: true });

const game = new Phaser.Game(gameConfig);
const inventoryUi = new InventoryUiController(game);
const reputationController = new ReputationController();
const stealthController = new StealthController(game);
const keyboardInputFallback = new KeyboardInputFallbackController();
const audioController = new AdaptiveAudioController();
const audioButton = document.querySelector<HTMLButtonElement>('[data-audio-toggle]');

const releasePointerFocus = (event: MouseEvent): void => {
  if (event.detail > 0 && document.body.dataset.scene === 'game') audioButton?.blur();
};
audioButton?.addEventListener('click', releasePointerFocus);

window.addEventListener('pagehide', () => {
  audioButton?.removeEventListener('click', releasePointerFocus);
  void audioController.destroy();
  keyboardInputFallback.destroy();
  stealthController.destroy();
  reputationController.destroy();
  inventoryUi.destroy();
  game.destroy(true);
});
