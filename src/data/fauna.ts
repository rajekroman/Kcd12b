import type { ItemId } from './items';

export type AnimalSpecies = 'hare' | 'roe-deer' | 'boar';
export type AnimalId = 'hare-north' | 'roe-east' | 'boar-south';
export type FaunaFrameState = 'idle' | 'walk-a' | 'walk-b' | 'hurt' | 'dead';

export interface FaunaLoot {
  itemId: ItemId;
  quantity: number;
}

export interface AnimalSpeciesDefinition {
  species: AnimalSpecies;
  label: string;
  health: number;
  fleeRadius: number;
  movementSpeed: number;
  activeHours: readonly [number, number][];
  loot: readonly FaunaLoot[];
  bodyWidth: number;
  bodyHeight: number;
}

export interface AnimalSpawnDefinition {
  id: AnimalId;
  species: AnimalSpecies;
  x: number;
  y: number;
  roamRadius: number;
}

export const FAUNA_FRAME_WIDTH = 24;
export const FAUNA_FRAME_HEIGHT = 18;
export const FAUNA_FRAME_STATES: readonly FaunaFrameState[] = [
  'idle',
  'walk-a',
  'walk-b',
  'hurt',
  'dead'
];

export const ANIMAL_SPECIES: Record<AnimalSpecies, AnimalSpeciesDefinition> = {
  hare: {
    species: 'hare',
    label: 'Zajíc',
    health: 18,
    fleeRadius: 105,
    movementSpeed: 122,
    activeHours: [[4, 10], [16, 22]],
    loot: [{ itemId: 'hare-meat', quantity: 1 }],
    bodyWidth: 13,
    bodyHeight: 7
  },
  'roe-deer': {
    species: 'roe-deer',
    label: 'Srnec',
    health: 32,
    fleeRadius: 145,
    movementSpeed: 105,
    activeHours: [[5, 12], [16, 20]],
    loot: [
      { itemId: 'venison', quantity: 2 },
      { itemId: 'deer-hide', quantity: 1 }
    ],
    bodyWidth: 17,
    bodyHeight: 11
  },
  boar: {
    species: 'boar',
    label: 'Kanec',
    health: 48,
    fleeRadius: 92,
    movementSpeed: 78,
    activeHours: [[0, 8], [17, 24]],
    loot: [
      { itemId: 'boar-meat', quantity: 2 },
      { itemId: 'boar-hide', quantity: 1 }
    ],
    bodyWidth: 19,
    bodyHeight: 10
  }
};

export const ANIMAL_SPAWNS: readonly AnimalSpawnDefinition[] = [
  { id: 'hare-north', species: 'hare', x: 265, y: 145, roamRadius: 72 },
  { id: 'roe-east', species: 'roe-deer', x: 1015, y: 235, roamRadius: 105 },
  { id: 'boar-south', species: 'boar', x: 890, y: 665, roamRadius: 82 }
];

export const getAnimalSpeciesDefinition = (
  species: AnimalSpecies
): AnimalSpeciesDefinition => ANIMAL_SPECIES[species];

export const getAnimalSpawnDefinition = (id: AnimalId): AnimalSpawnDefinition => {
  const definition = ANIMAL_SPAWNS.find((candidate) => candidate.id === id);
  if (!definition) throw new Error(`Unknown animal spawn ${id}.`);
  return definition;
};

export const getFaunaTextureKey = (species: AnimalSpecies): string => `fauna:${species}`;

export const getFaunaFrameIndex = (state: FaunaFrameState): number =>
  FAUNA_FRAME_STATES.indexOf(state);

export const getFaunaAnimationKey = (
  species: AnimalSpecies,
  animation: 'idle' | 'walk' | 'hurt' | 'dead'
): string => `${getFaunaTextureKey(species)}:${animation}`;
