import Phaser from 'phaser';
import { EventBus, GameEvents } from '../core/EventBus';
import {
  createInitialSuspicionState,
  getSuspicionLabel,
  normalizeVector,
  sampleVisionCone,
  updateSuspicion,
  type AwarenessLevel,
  type SuspicionState,
  type WorldVector
} from '../systems/StealthSystem';

const GUARD_NPC_ID = 'guard-vojtech';
const VISION_RANGE = 160;
const VISION_HALF_ANGLE = 32;

interface RuntimeObjects {
  scene: Phaser.Scene;
  player: Phaser.Physics.Arcade.Sprite;
  guard: Phaser.Physics.Arcade.Sprite;
  cone: Phaser.GameObjects.Graphics;
  indicator: Phaser.GameObjects.Text;
}

export class StealthController {
  private runtime?: RuntimeObjects;
  private suspicion: SuspicionState = createInitialSuspicionState();
  private facing: WorldVector = { x: -1, y: 0 };
  private previousLevel: AwarenessLevel = 'unaware';
  private previousTimestamp = 0;

  constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.STEP, this.onStep, this);
    document.body.dataset.stealthLevel = 'unaware';
    document.body.dataset.suspicion = '0';
    document.body.dataset.playerVisible = 'false';
  }

  destroy(): void {
    this.game.events.off(Phaser.Core.Events.STEP, this.onStep, this);
    this.destroyRuntime();
    delete document.body.dataset.stealthLevel;
    delete document.body.dataset.suspicion;
    delete document.body.dataset.playerVisible;
  }

  private onStep(time: number): void {
    const scene = this.game.scene.getScene('GameScene');
    if (!scene?.scene.isActive() || document.body.dataset.saveReady !== 'true') {
      this.destroyRuntime();
      this.previousTimestamp = time;
      return;
    }

    if (!this.runtime || this.runtime.scene !== scene) {
      this.runtime = this.createRuntime(scene);
      this.suspicion = createInitialSuspicionState();
      this.previousLevel = 'unaware';
      this.previousTimestamp = time;
      if (!this.runtime) return;
    }

    const deltaMs = this.previousTimestamp > 0 ? Math.min(100, Math.max(0, time - this.previousTimestamp)) : 0;
    this.previousTimestamp = time;
    this.updateFacing(this.runtime.guard);

    const sample = sampleVisionCone(
      {
        origin: { x: this.runtime.guard.x, y: this.runtime.guard.y },
        direction: this.facing,
        range: VISION_RANGE,
        halfAngleDegrees: VISION_HALF_ANGLE
      },
      { x: this.runtime.player.x, y: this.runtime.player.y }
    );

    this.suspicion = updateSuspicion({
      state: this.suspicion,
      sample,
      deltaMs,
      now: time
    });

    this.drawCone(this.runtime.cone, this.runtime.guard, sample.visible, this.suspicion.level);
    this.updateIndicator(this.runtime.indicator, this.suspicion);
    this.publishState(sample.visible);

    if (this.suspicion.level !== this.previousLevel) {
      this.publishTransition(this.previousLevel, this.suspicion.level);
      this.previousLevel = this.suspicion.level;
    }
  }

  private createRuntime(scene: Phaser.Scene): RuntimeObjects | undefined {
    const sprites = scene.children.list.filter(
      (child): child is Phaser.Physics.Arcade.Sprite =>
        child instanceof Phaser.Physics.Arcade.Sprite
    );
    const player = sprites.find((sprite) => sprite.texture.key === 'player');
    const guard = sprites.find((sprite) => sprite.getData('npcId') === GUARD_NPC_ID);
    if (!player || !guard) return undefined;

    const cone = scene.add.graphics().setDepth(7);
    const indicator = scene.add
      .text(12, 62, 'Nenápadnost: Klid 0 %', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#d8e1bd',
        backgroundColor: '#17110dcc',
        padding: { x: 6, y: 3 }
      })
      .setScrollFactor(0)
      .setDepth(200);

    return { scene, player, guard, cone, indicator };
  }

  private updateFacing(guard: Phaser.Physics.Arcade.Sprite): void {
    const velocity = guard.body?.velocity;
    if (!velocity || velocity.lengthSq() < 16) return;
    this.facing = normalizeVector({ x: velocity.x, y: velocity.y }, this.facing);
  }

  private drawCone(
    graphics: Phaser.GameObjects.Graphics,
    guard: Phaser.Physics.Arcade.Sprite,
    playerVisible: boolean,
    level: AwarenessLevel
  ): void {
    graphics.clear();
    const angle = Math.atan2(this.facing.y, this.facing.x);
    const spread = Phaser.Math.DegToRad(VISION_HALF_ANGLE);
    const left = {
      x: guard.x + Math.cos(angle - spread) * VISION_RANGE,
      y: guard.y + Math.sin(angle - spread) * VISION_RANGE
    };
    const right = {
      x: guard.x + Math.cos(angle + spread) * VISION_RANGE,
      y: guard.y + Math.sin(angle + spread) * VISION_RANGE
    };
    const color = level === 'alerted' ? 0xc84232 : level === 'suspicious' ? 0xd9a536 : 0xd6c36a;
    const alpha = playerVisible ? 0.22 : 0.1;

    graphics.fillStyle(color, alpha);
    graphics.fillTriangle(guard.x, guard.y, left.x, left.y, right.x, right.y);
    graphics.lineStyle(1, color, playerVisible ? 0.65 : 0.28);
    graphics.beginPath();
    graphics.moveTo(guard.x, guard.y);
    graphics.lineTo(left.x, left.y);
    graphics.moveTo(guard.x, guard.y);
    graphics.lineTo(right.x, right.y);
    graphics.strokePath();
  }

  private updateIndicator(indicator: Phaser.GameObjects.Text, state: SuspicionState): void {
    const value = Math.round(state.value);
    const colors: Record<AwarenessLevel, string> = {
      unaware: '#d8e1bd',
      suspicious: '#f0c86b',
      alerted: '#ff8d76'
    };
    indicator
      .setText(`Nenápadnost: ${getSuspicionLabel(state.level)} ${value} %`)
      .setColor(colors[state.level]);
  }

  private publishState(playerVisible: boolean): void {
    const value = Math.round(this.suspicion.value);
    document.body.dataset.stealthLevel = this.suspicion.level;
    document.body.dataset.suspicion = String(value);
    document.body.dataset.playerVisible = String(playerVisible);
    EventBus.emit(GameEvents.STEALTH_UPDATE, {
      level: this.suspicion.level,
      suspicion: value,
      playerVisible
    });
  }

  private publishTransition(previous: AwarenessLevel, next: AwarenessLevel): void {
    if (next === 'suspicious') {
      EventBus.emit(GameEvents.MESSAGE, 'Vojtěch si všiml podezřelého pohybu.');
    } else if (next === 'alerted') {
      EventBus.emit(GameEvents.MESSAGE, 'Poplach! Strážný tě odhalil.');
      this.runtime?.scene.cameras.main.shake(120, 0.008);
    } else if (previous !== 'unaware' && next === 'unaware') {
      EventBus.emit(GameEvents.MESSAGE, 'Strážný ztratil stopu.');
    }
  }

  private destroyRuntime(): void {
    this.runtime?.cone.destroy();
    this.runtime?.indicator.destroy();
    this.runtime = undefined;
    this.suspicion = createInitialSuspicionState();
    this.previousLevel = 'unaware';
    document.body.dataset.stealthLevel = 'unaware';
    document.body.dataset.suspicion = '0';
    document.body.dataset.playerVisible = 'false';
  }
}
