import type { ReputationFaction } from '../systems/ReputationSystem';
import type { NpcId } from './npcs';
import type { QuestEvent, QuestId, QuestStep } from './quests';

export interface DialogueReputationCondition {
  faction: ReputationFaction;
  min?: number;
  max?: number;
}

export interface DialogueCondition {
  questId?: QuestId;
  questSteps?: readonly QuestStep[];
  banditDefeated?: boolean;
  reputation?: DialogueReputationCondition;
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
  },
  {
    id: 'marta-ambient',
    npcId: 'innkeeper-marta',
    priority: 10,
    speaker: 'Hostinská Marta',
    text: 'Lavice jsou pro hosty, dluhy pro pobudy. Co z toho budeš ty?',
    actionLabel: 'Odejít'
  },
  {
    id: 'vojtech-ambient',
    npcId: 'guard-vojtech',
    priority: 10,
    speaker: 'Strážný Vojtěch',
    text: 'Vesnice je klidná jen proto, že někdo zůstává vzhůru.',
    actionLabel: 'Odejít'
  },
  {
    id: 'ondra-ambient',
    npcId: 'farmer-ondra',
    priority: 10,
    speaker: 'Sedlák Ondra',
    text: 'Pole nepočká na hrdiny ani na válku. Ráno chce pořád totéž.',
    actionLabel: 'Odejít'
  },
  {
    id: 'agnes-ambient',
    npcId: 'herbalist-agnes',
    priority: 10,
    speaker: 'Bylinkářka Anežka',
    text: 'Nešlapej mi do záhonu. Některé byliny léčí a jiné si urážku pamatují.',
    actionLabel: 'Odejít'
  },
  {
    id: 'jakub-ambient',
    npcId: 'miller-jakub',
    priority: 10,
    speaker: 'Mlynář Jakub',
    text: 'Kolo se točí, mouka padá a lidé si stejně myslí, že chléb roste v peci.',
    actionLabel: 'Odejít'
  },
  {
    id: 'matej-ambient',
    npcId: 'priest-matej',
    priority: 10,
    speaker: 'Otec Matěj',
    text: 'Modlitba člověka nezbaví práce. Jen mu připomene, proč ji má dokončit.',
    actionLabel: 'Odejít'
  },
  {
    id: 'katerina-honored',
    npcId: 'trader-katerina',
    priority: 40,
    speaker: 'Kupkyně Kateřina',
    text: 'Pro člověka s takovým jménem mám nejlepší kusy i poctivější cenu.',
    actionLabel: 'Poděkovat',
    when: {
      reputation: { faction: 'townsfolk', min: 60 }
    }
  },
  {
    id: 'katerina-distrusted',
    npcId: 'trader-katerina',
    priority: 40,
    speaker: 'Kupkyně Kateřina',
    text: 'Zboží ti ukážu, ale ruce nech na očích a smlouvat dnes nebudeš.',
    actionLabel: 'Odejít',
    when: {
      reputation: { faction: 'townsfolk', max: -20 }
    }
  },
  {
    id: 'katerina-ambient',
    npcId: 'trader-katerina',
    priority: 10,
    speaker: 'Kupkyně Kateřina',
    text: 'Dobré zboží se prodá samo. Špatné potřebuje hlasitého obchodníka.',
    actionLabel: 'Odejít'
  },
  {
    id: 'pavel-ambient',
    npcId: 'stablehand-pavel',
    priority: 10,
    speaker: 'Podkoní Pavel',
    text: 'Kůň pozná nejistou ruku dřív než člověk. A odpustí ji méně často.',
    actionLabel: 'Odejít'
  },
  {
    id: 'anna-ambient',
    npcId: 'washerwoman-anna',
    priority: 10,
    speaker: 'Pradlena Anna',
    text: 'Z bláta dostanu skoro všechno. Z pověsti člověka už méně.',
    actionLabel: 'Odejít'
  }
];
