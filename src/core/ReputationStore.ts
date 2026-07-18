import {
  createInitialReputationState,
  type ReputationChange,
  type ReputationState
} from '../systems/ReputationSystem';
import { applyReputationChanges } from '../systems/ReputationSystem';

export type ReputationListener = (state: ReputationState) => void;

let reputationState: ReputationState = createInitialReputationState();
const listeners = new Set<ReputationListener>();

export const getReputationState = (): ReputationState => reputationState;

export const setReputationState = (state: ReputationState): ReputationState => {
  reputationState = { ...state };
  listeners.forEach((listener) => listener(reputationState));
  return reputationState;
};

export const changeReputation = (
  changes: ReputationChange | readonly ReputationChange[]
): ReputationState =>
  setReputationState(
    applyReputationChanges(
      reputationState,
      Array.isArray(changes) ? changes : [changes]
    )
  );

export const resetReputationState = (): ReputationState =>
  setReputationState(createInitialReputationState());

export const subscribeReputation = (listener: ReputationListener): (() => void) => {
  listeners.add(listener);
  listener(reputationState);
  return () => listeners.delete(listener);
};
