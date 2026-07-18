import Phaser from 'phaser';
import { EventBus, GameEvents } from '../core/EventBus';
import {
  getCharacterAnimationKey,
  type CharacterAtlasKey
} from '../data/characterAtlases';

interface CharacterRuntime {
  scene: Phaser.Scene;
  player: Phaser.Physics.Arcade.Sprite;
  bandit: Phaser.Physics.Arcade.Sprite;
  playerLockUntil: number;
  banditLockUntil: number;
}

export class CharacterAnimationController {
  private runtime?: CharacterRuntime;

  constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.STEP, this.onStep, this);
    EventBus.on(GameEvents.ATTACK, this.onPlayerAttack, this);
    EventBus.on(GameEvents.MESSAGE, this.onMessage, this);
  }

  destroy(): void {
    this.game.events.off(Phaser.Core.Events.STEP, this.onStep, this);
    EventBus.off(GameEvents.ATTACK, this.onPlayerAttack, this);
    EventBus.off(GameEvents.MESSAGE, this.onMessage, this);
    this.runtime = undefined;
    delete document.body.dataset.playerAnimation;
    delete document.body.dataset.banditAnimation;
  }

  private onStep(time: number): void {
    const scene = this.game.scene.getScene('GameScene');
    if (!scene?.scene.isActive()) {
      this.runtime = undefined;
      return;
    }

    if (!this.runtime || this.runtime.scene !== scene) {
      this.runtime = this.createRuntime(scene);
      if (!this.runtime) return;
    }

    this.updateCharacter(this.runtime.player, 'player', time, this.runtime.playerLockUntil);
    if (this.runtime.bandit.active) {
      this.updateCharacter(this.runtime.bandit, 'bandit', time, this.runtime.banditLockUntil);
    }
  }

  private createRuntime(scene: Phaser.Scene): CharacterRuntime | undefined {
    const sprites = scene.children.list.filter(
      (child): child is Phaser.Physics.Arcade.Sprite =>
        child instanceof Phaser.Physics.Arcade.Sprite
    );
    const player = sprites.find((sprite) => sprite.texture.key === 'player');
    const bandit = sprites.find((sprite) => sprite.texture.key === 'bandit');
    if (!player || !bandit) return undefined;

    player.body?.setSize(14, 14).setOffset(3, 13);
    bandit.body?.setSize(14, 14).setOffset(3, 13);
    player.play(getCharacterAnimationKey('player', 'idle'), true);
    bandit.play(getCharacterAnimationKey('bandit', 'idle'), true);
    player.setData('atlasKey', 'player');
    bandit.setData('atlasKey', 'bandit');
    document.body.dataset.playerAtlas = 'player';
    document.body.dataset.banditAtlas = 'bandit';

    return {
      scene,
      player,
      bandit,
      playerLockUntil: 0,
      banditLockUntil: 0
    };
  }

  private updateCharacter(
    sprite: Phaser.Physics.Arcade.Sprite,
    atlasKey: CharacterAtlasKey,
    time: number,
    lockUntil: number
  ): void {
    if (time < lockUntil && sprite.anims.isPlaying) {
      this.publishAnimation(atlasKey, sprite.anims.currentAnim?.key ?? '');
      return;
    }

    const velocity = sprite.body?.velocity;
    const moving = Boolean(velocity && velocity.lengthSq() > 16);
    if (velocity && Math.abs(velocity.x) > 1) sprite.setFlipX(velocity.x < 0);
    this.playIfDifferent(sprite, atlasKey, moving ? 'walk' : 'idle');
    this.publishAnimation(atlasKey, sprite.anims.currentAnim?.key ?? '');
  }

  private onPlayerAttack(): void {
    const runtime = this.runtime;
    if (!runtime) return;
    runtime.player.play(getCharacterAnimationKey('player', 'action'), true);
    runtime.playerLockUntil = runtime.scene.time.now + 240;
  }

  private onMessage(message: unknown): void {
    const runtime = this.runtime;
    if (!runtime || typeof message !== 'string') return;
    const now = runtime.scene.time.now;

    if (message.startsWith('Lapka chystá')) {
      runtime.bandit.play(getCharacterAnimationKey('bandit', 'action'), true);
      runtime.banditLockUntil = now + 420;
      return;
    }

    if (
      message.includes('zásah za') ||
      message.startsWith('Zásah do odkrytého') ||
      message.startsWith('Lapka vykryl')
    ) {
      runtime.bandit.play(getCharacterAnimationKey('bandit', 'hurt'), true);
      runtime.banditLockUntil = now + 220;
    }

    if (
      message.startsWith('Lapka tě zasáhl') ||
      message.startsWith('Špatný směr krytu') ||
      message.startsWith('Lapka prolomil')
    ) {
      runtime.player.play(getCharacterAnimationKey('player', 'hurt'), true);
      runtime.playerLockUntil = now + 220;
    }
  }

  private playIfDifferent(
    sprite: Phaser.Physics.Arcade.Sprite,
    atlasKey: CharacterAtlasKey,
    animation: 'idle' | 'walk' | 'action' | 'hurt' | 'sleep'
  ): void {
    const key = getCharacterAnimationKey(atlasKey, animation);
    if (sprite.anims.currentAnim?.key !== key || !sprite.anims.isPlaying) {
      sprite.play(key, true);
    }
  }

  private publishAnimation(atlasKey: CharacterAtlasKey, key: string): void {
    if (atlasKey === 'player') document.body.dataset.playerAnimation = key;
    if (atlasKey === 'bandit') document.body.dataset.banditAnimation = key;
  }
}
