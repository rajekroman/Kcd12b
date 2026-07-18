import Phaser from 'phaser';
import {
  NPC_DEFINITIONS,
  type NpcActivity,
  type NpcDefinition,
  type NpcId
} from '../data/npcs';
import {
  getNpcScheduleStateFromClock,
  worldClockToHour,
  type NpcScheduleState
} from '../systems/NpcScheduleSystem';

export const NPC_ACTIVITY_LABELS: Record<NpcActivity, string> = {
  sleeping: 'spí',
  eating: 'jí',
  working: 'pracuje',
  serving: 'obsluhuje',
  patrolling: 'hlídkuje',
  praying: 'modlí se',
  trading: 'obchoduje',
  gathering: 'sbírá',
  washing: 'pere',
  socializing: 'rozmlouvá',
  closing: 'zavírá'
};

export interface NpcRuntime {
  definition: NpcDefinition;
  sprite: Phaser.Physics.Arcade.Sprite;
  nameLabel: Phaser.GameObjects.Text;
  activityLabel: Phaser.GameObjects.Text;
  schedule: NpcScheduleState;
}

export class NpcManager {
  private readonly runtimes = new Map<NpcId, NpcRuntime>();
  private snapshotBucket = -1;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly obstacles: Phaser.Physics.Arcade.StaticGroup,
    private readonly player: Phaser.Physics.Arcade.Sprite
  ) {}

  create(dayClock: number): void {
    for (const definition of NPC_DEFINITIONS) {
      const schedule = getNpcScheduleStateFromClock(definition, dayClock);
      const sprite = this.scene.physics.add
        .sprite(schedule.target.x, schedule.target.y, definition.texture)
        .setDepth(10)
        .setTint(definition.tint)
        .setCollideWorldBounds(true);
      sprite.body?.setSize(12, 12).setOffset(2, 8);
      sprite.setData('npcId', definition.id);
      this.scene.physics.add.collider(sprite, this.obstacles);

      const nameLabel = this.scene.add
        .text(sprite.x, sprite.y - 19, definition.name, {
          fontFamily: 'monospace',
          fontSize: '7px',
          color: '#f2dfba',
          backgroundColor: '#17110dbb',
          padding: { x: 3, y: 1 }
        })
        .setOrigin(0.5)
        .setDepth(19);
      const activityLabel = this.scene.add
        .text(sprite.x, sprite.y + 16, NPC_ACTIVITY_LABELS[schedule.activity], {
          fontFamily: 'monospace',
          fontSize: '6px',
          color: '#d2bc91',
          backgroundColor: '#17110d99',
          padding: { x: 2, y: 1 }
        })
        .setOrigin(0.5)
        .setDepth(19)
        .setVisible(false);

      const runtime = { definition, sprite, nameLabel, activityLabel, schedule };
      this.runtimes.set(definition.id, runtime);
      this.applyAppearance(runtime);
    }

    document.body.dataset.npcCount = String(this.runtimes.size);
    this.update(dayClock, true);
  }

  update(dayClock: number, forceSnapshot = false): void {
    for (const runtime of this.runtimes.values()) {
      const nextSchedule = getNpcScheduleStateFromClock(runtime.definition, dayClock);
      const scheduleChanged =
        nextSchedule.locationId !== runtime.schedule.locationId ||
        nextSchedule.activity !== runtime.schedule.activity;

      if (scheduleChanged) {
        runtime.schedule = nextSchedule;
        runtime.activityLabel.setText(NPC_ACTIVITY_LABELS[nextSchedule.activity]);
        this.applyAppearance(runtime);
      }

      const distanceToTarget = Phaser.Math.Distance.Between(
        runtime.sprite.x,
        runtime.sprite.y,
        runtime.schedule.target.x,
        runtime.schedule.target.y
      );
      if (distanceToTarget > 5) {
        this.scene.physics.moveTo(
          runtime.sprite,
          runtime.schedule.target.x,
          runtime.schedule.target.y,
          runtime.definition.movementSpeed
        );
      } else {
        runtime.sprite.setVelocity(0);
      }

      runtime.nameLabel.setPosition(runtime.sprite.x, runtime.sprite.y - 19);
      runtime.activityLabel
        .setPosition(runtime.sprite.x, runtime.sprite.y + 16)
        .setVisible(
          Phaser.Math.Distance.BetweenPoints(this.player, runtime.sprite) <=
            runtime.definition.interactionRadius * 1.8
        );
    }

    const hour = worldClockToHour(dayClock);
    const bucket = Math.floor(hour * 4);
    if (forceSnapshot || bucket !== this.snapshotBucket) {
      this.snapshotBucket = bucket;
      document.body.dataset.worldHour = hour.toFixed(2);
      document.body.dataset.npcSchedules = JSON.stringify(
        [...this.runtimes.values()].map((runtime) => ({
          id: runtime.definition.id,
          activity: runtime.schedule.activity,
          locationId: runtime.schedule.locationId
        }))
      );
    }
  }

  snapToSchedule(dayClock: number): void {
    for (const runtime of this.runtimes.values()) {
      runtime.schedule = getNpcScheduleStateFromClock(runtime.definition, dayClock);
      runtime.sprite
        .setPosition(runtime.schedule.target.x, runtime.schedule.target.y)
        .setVelocity(0);
      runtime.activityLabel.setText(NPC_ACTIVITY_LABELS[runtime.schedule.activity]);
      this.applyAppearance(runtime);
    }
    this.update(dayClock, true);
  }

  getById(id: NpcId): NpcRuntime {
    const runtime = this.runtimes.get(id);
    if (!runtime) throw new Error(`NPC runtime ${id} was not created.`);
    return runtime;
  }

  getNearestInteractable(): NpcRuntime | null {
    let nearest: NpcRuntime | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const runtime of this.runtimes.values()) {
      const distance = Phaser.Math.Distance.BetweenPoints(this.player, runtime.sprite);
      if (distance <= runtime.definition.interactionRadius && distance < nearestDistance) {
        nearest = runtime;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  destroy(): void {
    this.runtimes.clear();
    delete document.body.dataset.npcCount;
    delete document.body.dataset.worldHour;
    delete document.body.dataset.npcSchedules;
  }

  private applyAppearance(runtime: NpcRuntime): void {
    const sleeping = runtime.schedule.activity === 'sleeping';
    runtime.sprite.setAlpha(sleeping ? 0.58 : 1);
    runtime.nameLabel.setAlpha(sleeping ? 0.62 : 1);
  }
}
