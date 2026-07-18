export type QuestId = 'first-steel';
export type QuestStep = 'meet-smith' | 'defeat-bandit' | 'complete';
export type QuestEvent = 'smith-dialogue' | 'bandit-defeated';

export interface QuestState {
  id: QuestId;
  step: QuestStep;
  banditDefeated: boolean;
}

export interface QuestCondition {
  banditDefeated?: boolean;
}

export interface QuestObjectiveDefinition {
  text: string;
  when?: QuestCondition;
}

export interface QuestStepDefinition {
  id: QuestStep;
  objectives: readonly QuestObjectiveDefinition[];
}

export interface QuestTransitionDefinition {
  event: QuestEvent;
  from: QuestStep;
  to: QuestStep;
  when?: QuestCondition;
  set?: Partial<Pick<QuestState, 'banditDefeated'>>;
}

export interface QuestDefinition {
  id: QuestId;
  title: string;
  initialState: QuestState;
  steps: Record<QuestStep, QuestStepDefinition>;
  transitions: readonly QuestTransitionDefinition[];
}

export const FIRST_STEEL_QUEST: QuestDefinition = {
  id: 'first-steel',
  title: 'První ocel',
  initialState: {
    id: 'first-steel',
    step: 'meet-smith',
    banditDefeated: false
  },
  steps: {
    'meet-smith': {
      id: 'meet-smith',
      objectives: [
        {
          text: 'Promluv s kovářem Bohdanem o poraženém lapkovi.',
          when: { banditDefeated: true }
        },
        { text: 'Promluv s kovářem Bohdanem.' }
      ]
    },
    'defeat-bandit': {
      id: 'defeat-bandit',
      objectives: [{ text: 'Vyžeň lapku z východní cesty.' }]
    },
    complete: {
      id: 'complete',
      objectives: [{ text: 'Úkol dokončen: První ocel.' }]
    }
  },
  transitions: [
    {
      event: 'smith-dialogue',
      from: 'meet-smith',
      to: 'complete',
      when: { banditDefeated: true }
    },
    {
      event: 'smith-dialogue',
      from: 'meet-smith',
      to: 'defeat-bandit',
      when: { banditDefeated: false }
    },
    {
      event: 'bandit-defeated',
      from: 'meet-smith',
      to: 'meet-smith',
      set: { banditDefeated: true }
    },
    {
      event: 'bandit-defeated',
      from: 'defeat-bandit',
      to: 'complete',
      set: { banditDefeated: true }
    }
  ]
};

export const QUEST_DEFINITIONS: Record<QuestId, QuestDefinition> = {
  'first-steel': FIRST_STEEL_QUEST
};
