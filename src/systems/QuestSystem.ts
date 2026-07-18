export type QuestStep = 'meet-smith' | 'defeat-bandit' | 'complete';

export interface QuestState {
  id: 'first-steel';
  step: QuestStep;
  banditDefeated: boolean;
}

export const createInitialQuestState = (): QuestState => ({
  id: 'first-steel',
  step: 'meet-smith',
  banditDefeated: false
});

export const advanceQuestAfterDialogue = (state: QuestState): QuestState => {
  if (state.step !== 'meet-smith') return state;
  return { ...state, step: 'defeat-bandit' };
};

export const advanceQuestAfterBanditDefeat = (state: QuestState): QuestState => {
  if (state.step !== 'defeat-bandit') return state;
  return { ...state, step: 'complete', banditDefeated: true };
};

export const getQuestObjective = (state: QuestState): string => {
  switch (state.step) {
    case 'meet-smith':
      return 'Promluv s kovářem Bohdanem.';
    case 'defeat-bandit':
      return 'Vyžeň lapku z východní cesty.';
    case 'complete':
      return 'Úkol dokončen: První ocel.';
  }
};
