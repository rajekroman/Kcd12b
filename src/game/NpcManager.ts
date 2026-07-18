import Phaser from 'phaser';
import {
  getCharacterAnimationKey,
  type CharacterAtlasKey
} from '../data/characterAtlases';
import {
  NPC_DEFINITIONS,
  type NpcActivity,
  type NpcDefinition,
  type NpcId,
  type WorldPoint
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

const CROWD_OFFSETS: readonly WorldPoint[] = [
  { x: 0, y: 0 },
  { x: 12, y: 0 },
  { x: -12, y: 0 },
  { x: 0, y: 12 },
  { x: 0, y: -12 },
  { x: 10, y: 10 },
  { x: -10, y: 10 },
  { x: 10, y: -10 },
  { x: -10, y: -10 },
  { x: 18, y: 6 }
];

const ACTION_ACTIVITIES = new Set<NpcActivity>([
  'eating',
  'working',
  'serving',
  'praying',
  'trading',
  'gathering',
  'washing',
  'closing'
]);

export interface NpcRuntime {
  definition: NpcDefinition;
  atlasKey: CharacterAtlasKey;
  sprite: Phaser.Physics.Arcade.Sprite;
  nameLabel: Phaser.GameObjects.Text;
  activityLabel: Phaser.GameObjects.Text;
  schedule: NpcScheduleState;
  crowdOffset: WorldPoint;
  nextActionAt: number;
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
    NPC_DEFINITIONS.forEach((definition, index) => {
      const schedule = getNpcScheduleStateFromClock(definition, dayClock);
      const crowdOffset = CROWD_OFFSETS[index] ?? { x: 0, y: 0 };
      const target = this.getRuntimeTarget(schedule, crowdOffset);
      const atlasKey = definition.id as CharacterAtlasKey;
      const sprite = this.scene.physics.add
        .sprite(target.x, target.y, atlasKey, 0)
        .setDepth(10)
        .setCollideWorldBounds(true);
      sprite.body?.setSize(14, 14).setOffset(3, 13);
      sprite.setData('npcId', definition.id);
      sprite.setData('atlasKey', atlasKey);
      this.scene.physics.add.collider(sprite, this.obstacles);

      const nameLabel = this.scene.add
        .text(sprite.x, sprite.y - 24, definition.name, {
          fontFamily: 'monospace',
          fontSize: '7px',
          color: '#f2dfba',
          backgroundColor: '#17110dbb',
          padding: { x: 3, y: 1 }
        })
        .setOrigin(0.5)
        .setDepth(19);
      const activityLabel = this.scene.add
        .text(sprite.x, sprite.y + 20, NPC_ACTIVITY_LABELS[schedule.activity], {
          fontFamily: 'monospace',
          fontSize: '6px',
          color: '#d2bc91',
          backgroundColor: '#17110d99',
          padding: { x: 2, y: 1 }
        })
        .setOrigin(0.5)
        .setDepth(19)
        .setVisible(false);

      const runtime: NpcRuntime = {
        definition,
        atlasKey,
        sprite,
        nameLabel,
        activityLabel,
        schedule,
        crowdOffset,
        nextActionAt: this.scene.time.now + 500 + index * 170
      };
      this.runtimes.set(definition.id, runtime);
      this.applyAppearance(runtime, true);
    });

    document.body.dataset.npcCount = String(this.runtimes.size);
    document.body.dataset.npcAtlasKeys = JSON.stringify(
      [...this.runtimes.values()].map((runtime) => runtime.atlasKey)
    );
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
        runtime.nextActionAt = this.scene.time.now + 350;
        this.applyAppearance(runtime, true);
      }

      const target = this.getRuntimeTarget(runtime.schedule, runtime.crowdOffset);
      const distanceToTarget = Phaser.Math.Distance.Between(
        runtime.sprite.x,
        runtime.sprite.y,
        target.x,
        target.y
      );
      const moving = distanceToTarget > 5 && runtime.schedule.activity !== 'sleeping';
      if (moving) {
        this.scene.physics.moveTo(
          runtime.sprite,
          target.x,
          target.y,
          runtime.definition.movementSpeed
        );
      } else {
        runtime.sprite.setVelocity(0);
      }

      this.updateAnimation(runtime, moving);
      runtime.nameLabel.setPosition(runtime.sprite.x, runtime.sprite.y - 24);
      runtime.activityLabel
        .setPosition(runtime.sprite.x, runtime.sprite.y + 20)
        .setVisible(
          Phaser.Math.Distance.BetweenPoints(this.player, runtime.sprite) <=
            runtime.definition.interactionRadius * 1.8
        );
    }

    const nearestId = this.getNearestInteractable()?.definition.id;
    if (nearestId && document.body.dataset.nearNpc !== nearestId) {
      document.body.dataset.nearNpc = nearestId;
    } else if (!nearestId && document.body.dataset.nearNpc !== undefined) {
      delete document.body.dataset.nearNpc;
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
          locationId: runtime.schedule.locationId,
          atlasKey: runtime.atlasKey
        }))
      );
    }
  }

  snapToSchedule(dayClock: number): void {
    for (const runtime of this.runtimes.values()) {
      runtime.schedule = getNpcScheduleStateFromClock(runtime.definition, dayClock);
      const target = this.getRuntimeTarget(runtime.schedule, runtime.crowdOffset);
      runtime.sprite.setPosition(target.x, target.y).setVelocity(0);
      runtime.activityLabel.setText(NPC_ACTIVITY_LABELS[runtime.schedule.activity]);
      runtime.nextActionAt = this.scene.time.now + 350;
      this.applyAppearance(runtime, true);
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
    delete document.body.dataset.npcAtlasKeys;
    delete document.body.dataset.worldHour;
    delete document.body.dataset.npcSchedules;
    delete document.body.dataset.nearNpc;
  }

  private getRuntimeTarget(schedule: NpcScheduleState, offset: WorldPoint): WorldPoint {
    return {
      x: schedule.target.x + offset.x,
      y: schedule.target.y + offset.y
    };
  }

  private applyAppearance(runtime: NpcRuntime, forceAnimation = false): void {
    const sleeping = runtime.schedule.activity === 'sleeping';
    runtime.sprite.setAlpha(sleeping ? 0.72 : 1);
    runtime.nameLabel.setAlpha(sleeping ? 0.62 : 1);
    if (forceAnimation) {
      runtime.sprite.play(
        getCharacterAnimationKey(runtime.atlasKey, sleeping ? 'sleep' : 'idle'),
        true
      );
    }
  }

  private updateAnimation(runtime: NpcRuntime, moving: boolean): void {
    const velocityX = runtime.sprite.body?.velocity.x ?? 0;
    if (Math.abs(velocityX) > 1) runtime.sprite.setFlipX(velocityX < 0);

    if (runtime.schedule.activity === 'sleeping') {
      this.playIfDifferent(runtime, 'sleep');
      return;
    }
    if (moving) {
      this.playIfDifferent(runtime, 'walk');
      return;
    }

    const actionKey = getCharacterAnimationKey(runtime.atlasKey, 'action');
    if (runtime.sprite.anims.currentAnim?.key === actionKey && runtime.sprite.anims.isPlaying) {
      return;
    }

    if (
      ACTION_ACTIVITIES.has(runtime.schedule.activity) &&
      this.scene.time.now >= runtime.nextActionAt
    ) {
      runtime.sprite.play(actionKey, true);
      runtime.nextActionAt = this.scene.time.now + Phaser.Math.Between(1400, 2600);
      return;
    }

    this.playIfDifferent(runtime, 'idle');
  }

  private playIfDifferent(
    runtime: NpcRuntime,
    animation: 'idle' | 'walk' | 'action' | 'hurt' | 'sleep'
  ): void {
    const key = getCharacterAnimationKey(runtime.atlasKey, animation);
    if (runtime.sprite.anims.currentAnim?.key !== key || !runtime.sprite.anims.isPlaying) {
      runtime.sprite.play(key, true);
    }
  }
}
