import Phaser from 'phaser';
import { getEconomyState } from '../core/EconomyStore';
import { EventBus, GameEvents } from '../core/EventBus';
import type { AttackDirection } from '../systems/CombatSystem';
import { getEquipmentStats } from '../systems/InventorySystem';
import type { HuntingAttack } from '../systems/HuntingSystem';

const DIRECTION_VECTORS: Record<AttackDirection, { x: number; y: number }> = {
  high: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  'low-left': { x: -0.707, y: 0.707 },
  'low-right': { x: 0.707, y: 0.707 }
};

export class ConfirmedAttackController {
  private pendingFrame?: number;
  private pendingBeforeStamina?: number;
  private lastConfirmedAt = -1;

  constructor(private readonly game: Phaser.Game) {
    document.addEventListener('keydown', this.onKeyDown);
    EventBus.on(GameEvents.ATTACK, this.onAttackRequested, this);
  }

  destroy(): void {
    document.removeEventListener('keydown', this.onKeyDown);
    EventBus.off(GameEvents.ATTACK, this.onAttackRequested, this);
    if (this.pendingFrame !== undefined) cancelAnimationFrame(this.pendingFrame);
    this.pendingFrame = undefined;
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (
      event.code !== 'Space' ||
      event.repeat ||
      document.body.dataset.scene !== 'game' ||
      this.isFormControl(event.target)
    ) {
      return;
    }
    this.scheduleConfirmation();
  };

  private onAttackRequested(): void {
    this.scheduleConfirmation();
  }

  private scheduleConfirmation(): void {
    if (this.pendingFrame !== undefined || document.body.dataset.saveReady !== 'true') return;
    const before = Number(document.body.dataset.stamina);
    if (!Number.isFinite(before)) return;
    this.pendingBeforeStamina = before;

    const first = requestAnimationFrame(() => {
      this.pendingFrame = requestAnimationFrame(() => {
        this.pendingFrame = undefined;
        this.confirmIfExecuted();
      });
    });
    this.pendingFrame = first;
  }

  private confirmIfExecuted(): void {
    const before = this.pendingBeforeStamina;
    this.pendingBeforeStamina = undefined;
    if (before === undefined || document.body.dataset.scene !== 'game') return;
    const after = Number(document.body.dataset.stamina);
    if (!Number.isFinite(after) || after >= before) return;

    const scene = this.game.scene.getScene('GameScene');
    if (!scene?.scene.isActive()) return;
    const player = scene.children.list.find(
      (child): child is Phaser.Physics.Arcade.Sprite =>
        child instanceof Phaser.Physics.Arcade.Sprite && child.texture.key === 'player'
    );
    if (!player) return;

    const now = scene.time.now;
    if (now - this.lastConfirmedAt < 90) return;
    this.lastConfirmedAt = now;
    const direction = this.readDirection();
    const vector = DIRECTION_VECTORS[direction];
    const equipment = getEquipmentStats(getEconomyState().inventory);
    const damage = Math.max(1, Math.round((19 + equipment.attack) * (0.55 + before / 220)));
    const payload: HuntingAttack = {
      x: player.x,
      y: player.y,
      directionX: vector.x,
      directionY: vector.y,
      damage,
      reach: 62
    };

    EventBus.emit(GameEvents.PLAYER_ATTACKED, payload);
  }

  private readDirection(): AttackDirection {
    const direction = document.body.dataset.attackDirection;
    return direction && direction in DIRECTION_VECTORS
      ? (direction as AttackDirection)
      : 'high';
  }

  private isFormControl(target: EventTarget | null): boolean {
    return target instanceof HTMLElement &&
      target.matches('button, input, textarea, select, [contenteditable="true"]');
  }
}
