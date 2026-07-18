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
  PLAYER_ATTACKED: 'combat:player-attacked',
  BLOCK_START: 'input:block-start',
  BLOCK_END: 'input:block-end',
  DODGE: 'input:dodge',
  ATTACK_DIRECTION: 'input:attack-direction',
  ECONOMY_CHANGED: 'economy:changed',
  CONSUMABLE_USED: 'economy:consumable-used',
  STEALTH_UPDATE: 'stealth:update',
  FAUNA_HUNTED: 'fauna:hunted'
} as const;
