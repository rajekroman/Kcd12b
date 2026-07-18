import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { MenuScene } from './scenes/MenuScene';
import { UIScene } from './scenes/UIScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 480,
  height: 270,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#0b0a08',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 480,
    height: 270
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false, gravity: { x: 0, y: 0 } }
  },
  render: {
    antialias: false,
    pixelArt: true,
    roundPixels: true
  },
  scene: [BootScene, MenuScene, GameScene, UIScene]
};
