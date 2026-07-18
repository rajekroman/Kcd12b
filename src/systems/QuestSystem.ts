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
  if (state.banditDefeated) return { ...state, step: 'complete' };
  return { ...state, step: 'defeat-bandit' };
};

export const advanceQuestAfterBanditDefeat = (state: QuestState): QuestState => {
  if (state.step === 'complete') return state;
  if (state.step === 'meet-smith') return { ...state, banditDefeated: true };
  return { ...state, step: 'complete', banditDefeated: true };
};

export const getQuestObjective = (state: QuestState): string => {
  switch (state.step) {
    case 'meet-smith':
      return state.banditDefeated
        ? 'Promluv s kovářem Bohdanem o poraženém lapkovi.'
        : 'Promluv s kovářem Bohdanem.';
    case 'defeat-bandit':
      return 'Vyžeň lapku z východní cesty.';
    case 'complete':
      return 'Úkol dokončen: První ocel.';
  }
};
