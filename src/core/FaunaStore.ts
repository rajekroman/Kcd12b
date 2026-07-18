import { ANIMAL_SPAWNS, type AnimalId } from '../data/fauna';
import { serializeHuntedAnimals } from '../systems/HuntingSystem';

export type FaunaListener = (ids: readonly AnimalId[]) => void;

let huntedAnimals: AnimalId[] = [];
const listeners = new Set<FaunaListener>();

const isAnimalId = (value: unknown): value is AnimalId =>
  typeof value === 'string' && ANIMAL_SPAWNS.some((animal) => animal.id === value);

export const getHuntedAnimals = (): readonly AnimalId[] => huntedAnimals;

export const setHuntedAnimals = (ids: readonly AnimalId[]): readonly AnimalId[] => {
  huntedAnimals = serializeHuntedAnimals(ids.filter(isAnimalId));
  listeners.forEach((listener) => listener(huntedAnimals));
  return huntedAnimals;
};

export const markAnimalHunted = (id: AnimalId): readonly AnimalId[] =>
  setHuntedAnimals([...huntedAnimals, id]);

export const resetHuntedAnimals = (): readonly AnimalId[] => setHuntedAnimals([]);

export const subscribeHuntedAnimals = (listener: FaunaListener): (() => void) => {
  listeners.add(listener);
  listener(huntedAnimals);
  return () => listeners.delete(listener);
};
