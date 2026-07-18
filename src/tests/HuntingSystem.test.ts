import { describe, expect, it } from 'vitest';
import {
  ANIMAL_SPAWNS,
  ANIMAL_SPECIES,
  FAUNA_FRAME_STATES,
  getFaunaAnimationKey,
  getFaunaFrameIndex
} from '../data/fauna';
import { createInitialInventoryState, getItemQuantity } from '../systems/InventorySystem';
import {
  addHuntingLoot,
  getEffectiveFleeRadius,
  isAnimalActiveAtHour,
  resolveHuntingHit,
  serializeHuntedAnimals
} from '../systems/HuntingSystem';
import {
  buildFaunaAtlas,
  buildFaunaFrame,
  validateFaunaFrame
} from '../systems/FaunaAtlasSystem';

describe('HuntingSystem', () => {
  it('definuje tři druhy a tři stabilní spawny', () => {
    expect(Object.keys(ANIMAL_SPECIES)).toEqual(['hare', 'roe-deer', 'boar']);
    expect(ANIMAL_SPAWNS).toHaveLength(3);
    expect(new Set(ANIMAL_SPAWNS.map((animal) => animal.id)).size).toBe(3);
  });

  it('všech patnáct fauna frameů zůstane uvnitř 24 × 18', () => {
    for (const species of Object.keys(ANIMAL_SPECIES) as Array<keyof typeof ANIMAL_SPECIES>) {
      const atlas = buildFaunaAtlas(species);
      expect(atlas).toHaveLength(FAUNA_FRAME_STATES.length);
      for (const frame of atlas) {
        expect(validateFaunaFrame(frame), `${species}:${frame.state}`).toEqual([]);
      }
    }
  });

  it('chůze, zranění a smrt mají odlišnou siluetu', () => {
    const idle = buildFaunaFrame('boar', 'idle');
    const walk = buildFaunaFrame('boar', 'walk-a');
    const hurt = buildFaunaFrame('boar', 'hurt');
    const dead = buildFaunaFrame('boar', 'dead');

    expect(walk.pixels).not.toEqual(idle.pixels);
    expect(hurt.pixels).not.toEqual(idle.pixels);
    expect(dead.pixels).not.toEqual(idle.pixels);
    expect(getFaunaFrameIndex('dead')).toBe(4);
    expect(getFaunaAnimationKey('hare', 'walk')).toBe('fauna:hare:walk');
  });

  it('respektuje denní aktivitu každého druhu', () => {
    expect(isAnimalActiveAtHour('hare', 6)).toBe(true);
    expect(isAnimalActiveAtHour('hare', 13)).toBe(false);
    expect(isAnimalActiveAtHour('roe-deer', 18)).toBe(true);
    expect(isAnimalActiveAtHour('roe-deer', 23)).toBe(false);
    expect(isAnimalActiveAtHour('boar', 3)).toBe(true);
    expect(isAnimalActiveAtHour('boar', 12)).toBe(false);
  });

  it('nižší viditelnost zkrátí vzdálenost, na kterou zvěř reaguje', () => {
    expect(getEffectiveFleeRadius('roe-deer', 0.62)).toBeLessThan(
      getEffectiveFleeRadius('roe-deer', 1)
    );
    expect(getEffectiveFleeRadius('boar', Number.NaN)).toBe(
      getEffectiveFleeRadius('boar', 1)
    );
  });

  it('zásah vyžaduje dosah i směr útoku', () => {
    const target = {
      id: 'hare-north' as const,
      species: 'hare' as const,
      x: 45,
      y: 0,
      health: 18
    };
    const hit = resolveHuntingHit(
      { x: 0, y: 0, directionX: 1, directionY: 0, damage: 10, reach: 62 },
      target
    );
    const wrongDirection = resolveHuntingHit(
      { x: 0, y: 0, directionX: -1, directionY: 0, damage: 10, reach: 62 },
      target
    );
    const tooFar = resolveHuntingHit(
      { x: 0, y: 0, directionX: 1, directionY: 0, damage: 30, reach: 30 },
      target
    );

    expect(hit.outcome).toBe('hit');
    expect(hit.health).toBe(8);
    expect(wrongDirection.outcome).toBe('miss');
    expect(tooFar.outcome).toBe('miss');
  });

  it('smrtící zásah a kořist jsou deterministické', () => {
    const killed = resolveHuntingHit(
      { x: 0, y: 0, directionX: 1, directionY: 0, damage: 40, reach: 62 },
      { id: 'hare-north', species: 'hare', x: 30, y: 0, health: 18 }
    );
    const loot = addHuntingLoot(createInitialInventoryState(), 'roe-deer');

    expect(killed.outcome).toBe('killed');
    expect(loot.ok).toBe(true);
    if (loot.ok) {
      expect(getItemQuantity(loot.value.inventory.items, 'venison')).toBe(2);
      expect(getItemQuantity(loot.value.inventory.items, 'deer-hide')).toBe(1);
    }
  });

  it('atomicky odmítne kořist, která překročí nosnost', () => {
    const inventory = { ...createInitialInventoryState(), maxWeight: 3 };
    const result = addHuntingLoot(inventory, 'boar');

    expect(result.ok).toBe(false);
    expect(inventory.items.some((stack) => stack.itemId === 'boar-meat')).toBe(false);
  });

  it('serializace ulovených kusů odstraní duplicity a zachová stabilní pořadí', () => {
    expect(serializeHuntedAnimals(['roe-east', 'hare-north', 'roe-east'])).toEqual([
      'hare-north',
      'roe-east'
    ]);
  });
});
