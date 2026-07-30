import Phaser from 'phaser';
import { registerSW } from 'virtual:pwa-register';
import { AdaptiveAudioController } from './game/AdaptiveAudioController';
import { CharacterAnimationController } from './game/CharacterAnimationController';
import { ConfirmedAttackController } from './game/ConfirmedAttackController';
import { CraftingUiController } from './game/CraftingUiController';
import { gameConfig } from './game/config';
import { HuntingController } from './game/HuntingController';
import { InventoryUiController } from './game/InventoryUiController';
import { KeyboardInputFallbackController } from './game/KeyboardInputFallbackController';
import { ReputationController } from './game/ReputationController';
import { StealthController } from './game/StealthController';
import { WeatherController } from './game/WeatherController';
import './styles/main.css';
import './styles/reputation.css';
import './styles/audio.css';
import './styles/crafting.css';

registerSW({ immediate: true });

const game = new Phaser.Game(gameConfig);
const inventoryUi = new InventoryUiController(game);
const craftingUi = new CraftingUiController(game);
const reputationController = new ReputationController();
const stealthController = new StealthController(game);
const confirmedAttackController = new ConfirmedAttackController(game);
const characterAnimationController = new CharacterAnimationController(game);
const huntingController = new HuntingController(game);
const weatherController = new WeatherController(game);
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
  weatherController.destroy();
  huntingController.destroy();
  characterAnimationController.destroy();
  confirmedAttackController.destroy();
  stealthController.destroy();
  reputationController.destroy();
  craftingUi.destroy();
  inventoryUi.destroy();
  game.destroy(true);
});
