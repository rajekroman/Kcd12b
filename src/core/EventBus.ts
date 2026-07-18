import Phaser from 'phaser';

export const EventBus = new Phaser.Events.EventEmitter();

export const GameEvents = {
  HUD_UPDATE: 'hud:update',
  UI_READY: 'ui:ready',
  DIALOGUE_OPEN: 'dialogue:open',
  DIALOGUE_CLOSE: 'dialogue:close',
  MESSAGE: 'message',
  INTERACT: 'input:interact',
  ATTACK: 'input:attack',
  BLOCK_START: 'input:block-start',
  BLOCK_END: 'input:block-end',
  DODGE: 'input:dodge',
  ATTACK_DIRECTION: 'input:attack-direction'
} as const;
