import Phaser from 'phaser';

export const EventBus = new Phaser.Events.EventEmitter();

export const GameEvents = {
  HUD_UPDATE: 'hud:update',
  DIALOGUE_OPEN: 'dialogue:open',
  DIALOGUE_CLOSE: 'dialogue:close',
  MESSAGE: 'message',
  INTERACT: 'input:interact',
  ATTACK: 'input:attack'
} as const;
