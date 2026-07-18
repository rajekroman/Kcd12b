import {
  QUEST_DEFINITIONS,
  type QuestCondition,
  type QuestDefinition,
  type QuestEvent,
  type QuestId,
  type QuestState
} from '../data/quests';

export type { QuestEvent, QuestId, QuestState, QuestStep } from '../data/quests';

export type QuestCompletionListener = (
  completed: QuestState,
  previous: QuestState,
  event: QuestEvent
) => void;

const completionListeners = new Set<QuestCompletionListener>();

const matchesCondition = (state: QuestState, condition?: QuestCondition): boolean => {
  if (!condition) return true;
  if (
    condition.banditDefeated !== undefined &&
    condition.banditDefeated !== state.banditDefeated
  ) {
    return false;
  }
  return true;
};

export const subscribeQuestCompleted = (
  listener: QuestCompletionListener
): (() => void) => {
  completionListeners.add(listener);
  return () => completionListeners.delete(listener);
};

export const getQuestDefinition = (id: QuestId): QuestDefinition => QUEST_DEFINITIONS[id];

export const createInitialQuestState = (id: QuestId = 'first-steel'): QuestState => ({
  ...getQuestDefinition(id).initialState
});

export const applyQuestEvent = (state: QuestState, event: QuestEvent): QuestState => {
  const definition = getQuestDefinition(state.id);
  const transition = definition.transitions.find(
    (candidate) =>
      candidate.event === event &&
      candidate.from === state.step &&
      matchesCondition(state, candidate.when)
  );

  if (!transition) return state;
  const nextState: QuestState = {
    ...state,
    ...transition.set,
    step: transition.to
  };

  if (state.step !== 'complete' && nextState.step === 'complete') {
    completionListeners.forEach((listener) => listener(nextState, state, event));
  }

  return nextState;
};

export const advanceQuestAfterDialogue = (state: QuestState): QuestState =>
  applyQuestEvent(state, 'smith-dialogue');

export const advanceQuestAfterBanditDefeat = (state: QuestState): QuestState =>
  applyQuestEvent(state, 'bandit-defeated');

export const getQuestObjective = (state: QuestState): string => {
  const definition = getQuestDefinition(state.id);
  const step = definition.steps[state.step];
  const objective = step.objectives.find((candidate) => matchesCondition(state, candidate.when));
  if (!objective) throw new Error(`Quest ${state.id} step ${state.step} has no matching objective.`);
  return objective.text;
};
