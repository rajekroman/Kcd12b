import {
  createInitialEconomyState,
  type EconomyState
} from '../systems/InventorySystem';

export type EconomyListener = (state: EconomyState) => void;

let economyState: EconomyState = createInitialEconomyState();
const listeners = new Set<EconomyListener>();

const cloneState = (state: EconomyState): EconomyState => structuredClone(state);

export const getEconomyState = (): EconomyState => economyState;

export const setEconomyState = (state: EconomyState): EconomyState => {
  economyState = cloneState(state);
  listeners.forEach((listener) => listener(economyState));
  return economyState;
};

export const updateEconomyState = (
  updater: (state: EconomyState) => EconomyState
): EconomyState => setEconomyState(updater(economyState));

export const resetEconomyState = (): EconomyState =>
  setEconomyState(createInitialEconomyState());

export const subscribeEconomy = (listener: EconomyListener): (() => void) => {
  listeners.add(listener);
  listener(economyState);
  return () => listeners.delete(listener);
};
