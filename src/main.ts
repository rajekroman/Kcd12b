import Phaser from 'phaser';
import { registerSW } from 'virtual:pwa-register';
import { gameConfig } from './game/config';
import './styles/main.css';

registerSW({ immediate: true });

const game = new Phaser.Game(gameConfig);

window.addEventListener('pagehide', () => game.destroy(true));
