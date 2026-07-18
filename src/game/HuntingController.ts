import Phaser from 'phaser';
import { getEconomyState, updateEconomyState } from '../core/EconomyStore';
import { EventBus, GameEvents } from '../core/EventBus';
import { getHuntedAnimals, markAnimalHunted } from '../core/FaunaStore';
import {
  ANIMAL_SPAWNS,
  ANIMAL_SPECIES,
  getFaunaAnimationKey,
  getFaunaTextureKey,
  type AnimalId,
  type AnimalSpawnDefinition
} from '../data/fauna';
import { ITEM_DEFINITIONS } from '../data/items';
import {
  addHuntingLoot,
  getEffectiveFleeRadius,
  isAnimalActiveAtHour,
  resolveHuntingHit,
  type HuntingAttack
} from '../systems/HuntingSystem';

interface AnimalRuntime {
  definition: AnimalSpawnDefinition;
  sprite: Phaser.Physics.Arcade.Sprite;
  health: number;
  nextWanderAt: number;
  actionLockUntil: number;
  dead: boolean;
}

interface HuntingRuntime {
  scene: Phaser.Scene;
  player: Phaser.Physics.Arcade.Sprite;
  animals: Map<AnimalId, AnimalRuntime>;
}

export class HuntingController {
  private runtime?: HuntingRuntime;

  constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.STEP, this.onStep, this);
    EventBus.on(GameEvents.PLAYER_ATTACKED, this.onPlayerAttacked, this);
  }

  destroy(): void {
    this.game.events.off(Phaser.Core.Events.STEP, this.onStep, this);
    EventBus.off(GameEvents.PLAYER_ATTACKED, this.onPlayerAttacked, this);
    this.runtime = undefined;
    this.clearDataset();
  }

  private onStep(time: number): void {
    const scene = this.game.scene.getScene('GameScene');
    if (!scene?.scene.isActive()) {
      if (this.runtime) {
        this.runtime = undefined;
        this.clearDataset();
      }
      return;
    }

    if (!this.runtime || this.runtime.scene !== scene) {
      this.runtime = this.createRuntime(scene);
      if (!this.runtime) return;
    }

    const hour = Number(document.body.dataset.worldHour ?? 0);
    const visibility = Number(document.body.dataset.weatherVisibility ?? 1);
    const hunted = new Set(getHuntedAnimals());

    for (const animal of this.runtime.animals.values()) {
      if (hunted.has(animal.definition.id)) {
        if (animal.sprite.active) animal.sprite.disableBody(true, true);
        animal.dead = true;
        continue;
      }

      const species = ANIMAL_SPECIES[animal.definition.species];
      const active = isAnimalActiveAtHour(animal.definition.species, hour);
      animal.sprite.setVisible(active).setActive(active);
      if (animal.sprite.body) animal.sprite.body.enable = active;
      if (!active) {
        animal.sprite.setVelocity(0);
        continue;
      }

      const distance = Phaser.Math.Distance.BetweenPoints(this.runtime.player, animal.sprite);
      const fleeRadius = getEffectiveFleeRadius(animal.definition.species, visibility);
      if (distance <= fleeRadius) {
        const away = new Phaser.Math.Vector2(
          animal.sprite.x - this.runtime.player.x,
          animal.sprite.y - this.runtime.player.y
        );
        if (away.lengthSq() < 0.01) away.set(1, 0);
        away.normalize();
        animal.sprite.setVelocity(away.x * species.movementSpeed, away.y * species.movementSpeed);
        animal.nextWanderAt = time + 950;
      } else if (time >= animal.nextWanderAt) {
        const phase = this.stablePhase(animal.definition.id, Math.floor(time / 1800));
        this.runtime.scene.physics.moveTo(
          animal.sprite,
          animal.definition.x + Math.cos(phase) * animal.definition.roamRadius,
          animal.definition.y + Math.sin(phase) * animal.definition.roamRadius,
          species.movementSpeed * 0.34
        );
        animal.nextWanderAt = time + 1800;
      }

      const velocity = animal.sprite.body?.velocity;
      const moving = Boolean(velocity && velocity.lengthSq() > 9);
      if (velocity && Math.abs(velocity.x) > 1) animal.sprite.setFlipX(velocity.x < 0);
      if (time >= animal.actionLockUntil) this.playIfDifferent(animal, moving ? 'walk' : 'idle');
    }

    this.publishSnapshot();
  }

  private createRuntime(scene: Phaser.Scene): HuntingRuntime | undefined {
    const player = scene.children.list.find(
      (child): child is Phaser.Physics.Arcade.Sprite =>
        child instanceof Phaser.Physics.Arcade.Sprite && child.texture.key === 'player'
    );
    if (!player) return undefined;

    const animals = new Map<AnimalId, AnimalRuntime>();
    for (const definition of ANIMAL_SPAWNS) {
      const species = ANIMAL_SPECIES[definition.species];
      const sprite = scene.physics.add
        .sprite(definition.x, definition.y, getFaunaTextureKey(definition.species), 0)
        .setDepth(9)
        .setCollideWorldBounds(true)
        .setData('animalId', definition.id)
        .setData('species', definition.species);
      sprite.body?.setSize(species.bodyWidth, species.bodyHeight).setOffset(
        Math.floor((24 - species.bodyWidth) / 2),
        18 - species.bodyHeight
      );
      sprite.play(getFaunaAnimationKey(definition.species, 'idle'), true);
      animals.set(definition.id, {
        definition,
        sprite,
        health: species.health,
        nextWanderAt: scene.time.now + 450,
        actionLockUntil: 0,
        dead: false
      });
    }

    document.body.dataset.faunaCount = String(animals.size);
    document.body.dataset.faunaSpecies = JSON.stringify(
      [...animals.values()].map((animal) => animal.definition.species)
    );
    return { scene, player, animals };
  }

  private onPlayerAttacked(attack: HuntingAttack): void {
    const runtime = this.runtime;
    if (!runtime) return;

    const candidate = [...runtime.animals.values()]
      .filter((animal) => animal.sprite.active && !animal.dead)
      .map((animal) => ({
        animal,
        resolution: resolveHuntingHit(attack, {
          id: animal.definition.id,
          species: animal.definition.species,
          x: animal.sprite.x,
          y: animal.sprite.y,
          health: animal.health
        })
      }))
      .filter(({ resolution }) => resolution.outcome !== 'miss')
      .sort((left, right) => left.resolution.distance - right.resolution.distance)[0];

    if (!candidate) return;
    const { animal, resolution } = candidate;
    const species = ANIMAL_SPECIES[animal.definition.species];

    if (resolution.outcome === 'killed') {
      const economyResult = addHuntingLoot(
        structuredClone(getEconomyState().inventory),
        animal.definition.species
      );
      if (!economyResult.ok) {
        animal.health = 1;
        animal.actionLockUntil = runtime.scene.time.now + 300;
        animal.sprite.play(getFaunaAnimationKey(animal.definition.species, 'hurt'), true);
        EventBus.emit(
          GameEvents.MESSAGE,
          `Nemáš místo na kořist z druhu ${species.label.toLowerCase()}. Zvíře uniká.`
        );
        return;
      }

      updateEconomyState((state) => ({ ...state, inventory: economyResult.value.inventory }));
      markAnimalHunted(animal.definition.id);
      animal.health = 0;
      animal.dead = true;
      animal.sprite
        .setVelocity(0)
        .play(getFaunaAnimationKey(animal.definition.species, 'dead'), true);
      animal.actionLockUntil = Number.POSITIVE_INFINITY;
      EventBus.emit(GameEvents.FAUNA_HUNTED, animal.definition.id);
      EventBus.emit(GameEvents.ECONOMY_CHANGED);
      const lootText = economyResult.value.loot
        .map((loot) => `${loot.quantity}× ${ITEM_DEFINITIONS[loot.itemId].name}`)
        .join(', ');
      EventBus.emit(GameEvents.MESSAGE, `${species.label} uloven. Kořist: ${lootText}.`);
      this.publishSnapshot();
      return;
    }

    animal.health = resolution.health;
    animal.actionLockUntil = runtime.scene.time.now + 260;
    animal.sprite.play(getFaunaAnimationKey(animal.definition.species, 'hurt'), true);
    EventBus.emit(GameEvents.MESSAGE, `${species.label} zasažen. Zdraví ${animal.health}.`);
  }

  private playIfDifferent(
    animal: AnimalRuntime,
    animation: 'idle' | 'walk' | 'hurt' | 'dead'
  ): void {
    const key = getFaunaAnimationKey(animal.definition.species, animation);
    if (animal.sprite.anims.currentAnim?.key !== key || !animal.sprite.anims.isPlaying) {
      animal.sprite.play(key, true);
    }
  }

  private stablePhase(id: AnimalId, bucket: number): number {
    const base = id.split('').reduce((sum, character) => sum + character.charCodeAt(0), 0);
    return ((base + bucket * 97) % 360) * (Math.PI / 180);
  }

  private publishSnapshot(): void {
    const runtime = this.runtime;
    if (!runtime) return;
    document.body.dataset.huntedAnimals = JSON.stringify(getHuntedAnimals());
    document.body.dataset.faunaSnapshot = JSON.stringify(
      [...runtime.animals.values()].map((animal) => ({
        id: animal.definition.id,
        species: animal.definition.species,
        health: animal.health,
        active: animal.sprite.active,
        dead: animal.dead,
        x: Math.round(animal.sprite.x),
        y: Math.round(animal.sprite.y)
      }))
    );
  }

  private clearDataset(): void {
    delete document.body.dataset.faunaCount;
    delete document.body.dataset.faunaSpecies;
    delete document.body.dataset.faunaSnapshot;
    delete document.body.dataset.huntedAnimals;
  }
}
