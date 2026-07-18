import type { QuestEvent, QuestId, QuestStep } from './quests';

export type NpcId = 'smith-bohdan';

export interface DialogueCondition {
  questId?: QuestId;
  questSteps?: readonly QuestStep[];
  banditDefeated?: boolean;
}

export interface DialogueEffect {
  type: 'quest-event';
  event: QuestEvent;
}

export interface DialogueDefinition {
  id: string;
  npcId: NpcId;
  priority: number;
  speaker: string;
  text: string;
  actionLabel: string;
  when?: DialogueCondition;
  effects?: readonly DialogueEffect[];
}

export const DIALOGUE_DEFINITIONS: readonly DialogueDefinition[] = [
  {
    id: 'bohdan-report-early-victory',
    npcId: 'smith-bohdan',
    priority: 100,
    speaker: 'Kovář Bohdan',
    text: 'Tak ty už ses s tím lapkou vypořádal? Dobrá práce. Ocel poslouchá toho, kdo nezaváhá.',
    actionLabel: 'Dokončit úkol',
    when: {
      questId: 'first-steel',
      questSteps: ['meet-smith'],
      banditDefeated: true
    },
    effects: [{ type: 'quest-event', event: 'smith-dialogue' }]
  },
  {
    id: 'bohdan-offer-first-steel',
    npcId: 'smith-bohdan',
    priority: 90,
    speaker: 'Kovář Bohdan',
    text: 'Na východní cestě se usadil lapka. Vezmi tenhle meč a ukaž, že nejsi jen učedník.',
    actionLabel: 'Přijmout úkol',
    when: {
      questId: 'first-steel',
      questSteps: ['meet-smith'],
      banditDefeated: false
    },
    effects: [{ type: 'quest-event', event: 'smith-dialogue' }]
  },
  {
    id: 'bohdan-remind-first-steel',
    npcId: 'smith-bohdan',
    priority: 80,
    speaker: 'Kovář Bohdan',
    text: 'Lapka je stále na cestě. Sleduj jeho kryt a udeř tam, kde se odkryje.',
    actionLabel: 'Rozumím',
    when: {
      questId: 'first-steel',
      questSteps: ['defeat-bandit']
    }
  },
  {
    id: 'bohdan-first-steel-complete',
    npcId: 'smith-bohdan',
    priority: 70,
    speaker: 'Kovář Bohdan',
    text: 'Dobrá práce. Ocel poslouchá toho, kdo nezaváhá.',
    actionLabel: 'Odejít',
    when: {
      questId: 'first-steel',
      questSteps: ['complete']
    }
  }
];
