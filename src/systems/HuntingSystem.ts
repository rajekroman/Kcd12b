import {
  ANIMAL_SPECIES,
  type AnimalId,
  type AnimalSpecies,
  type FaunaLoot
} from '../data/fauna';
import { addItem, type InventoryResult, type InventoryState } from './InventorySystem';

export interface HuntingAttack {
  x: number;
  y: number;
  directionX: number;
  directionY: number;
  damage: number;
  reach: number;
}

export interface AnimalTarget {
  id: AnimalId;
  species: AnimalSpecies;
  x: number;
  y: number;
  health: number;
}

export type HuntingHitOutcome = 'miss' | 'hit' | 'killed';

export interface HuntingHitResolution {
  outcome: HuntingHitOutcome;
  health: number;
  distance: number;
  facingDot: number;
}

export interface LootBundleResult {
  inventory: InventoryState;
  loot: readonly FaunaLoot[];
}

const normalizeHour = (hour: number): number =>
  Number.isFinite(hour) ? ((hour % 24) + 24) % 24 : 0;

export const isAnimalActiveAtHour = (species: AnimalSpecies, hour: number): boolean => {
  const normalized = normalizeHour(hour);
  return ANIMAL_SPECIES[species].activeHours.some(([start, end]) => {
    if (start === end) return true;
    if (start < end) return normalized >= start && normalized < end;
    return normalized >= start || normalized < end;
  });
};

export const getEffectiveFleeRadius = (
  species: AnimalSpecies,
  weatherVisibility: number
): number => {
  const base = ANIMAL_SPECIES[species].fleeRadius;
  const visibility = Number.isFinite(weatherVisibility)
    ? Math.min(1, Math.max(0.35, weatherVisibility))
    : 1;
  return Math.round(base * (0.62 + visibility * 0.38));
};

export const resolveHuntingHit = (
  attack: HuntingAttack,
  target: AnimalTarget,
  minimumFacingDot = 0.18
): HuntingHitResolution => {
  const dx = target.x - attack.x;
  const dy = target.y - attack.y;
  const distance = Math.hypot(dx, dy);
  const directionLength = Math.hypot(attack.directionX, attack.directionY);
  const targetLength = distance;
  const facingDot =
    directionLength > 0 && targetLength > 0
      ? (attack.directionX * dx + attack.directionY * dy) / (directionLength * targetLength)
      : 1;

  const validDamage = Number.isFinite(attack.damage) ? Math.max(0, attack.damage) : 0;
  const validReach = Number.isFinite(attack.reach) ? Math.max(0, attack.reach) : 0;
  if (distance > validReach || facingDot < minimumFacingDot || validDamage <= 0) {
    return { outcome: 'miss', health: target.health, distance, facingDot };
  }

  const health = Math.max(0, target.health - validDamage);
  return {
    outcome: health === 0 ? 'killed' : 'hit',
    health,
    distance,
    facingDot
  };
};

export const addHuntingLoot = (
  inventory: InventoryState,
  species: AnimalSpecies
): InventoryResult<LootBundleResult> => {
  const loot = ANIMAL_SPECIES[species].loot;
  let nextInventory = inventory;

  for (const entry of loot) {
    const result = addItem(nextInventory, entry.itemId, entry.quantity);
    if (!result.ok) return result;
    nextInventory = result.value;
  }

  return { ok: true, value: { inventory: nextInventory, loot } };
};

export const serializeHuntedAnimals = (ids: readonly AnimalId[]): AnimalId[] =>
  [...new Set(ids)].sort();
