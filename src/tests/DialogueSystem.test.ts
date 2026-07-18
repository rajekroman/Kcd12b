import { describe, expect, it } from 'vitest';
import { DIALOGUE_DEFINITIONS, type DialogueDefinition } from '../data/dialogues';
import { applyDialogueEffects, getDialogueForNpc } from '../systems/DialogueSystem';
import {
  advanceQuestAfterBanditDefeat,
  advanceQuestAfterDialogue,
  createInitialQuestState
} from '../systems/QuestSystem';

describe('DialogueSystem', () => {
  it('vybere nabídku questu pro první rozhovor', () => {
    const dialogue = getDialogueForNpc('smith-bohdan', {
      quest: createInitialQuestState()
    });

    expect(dialogue?.id).toBe('bohdan-offer-first-steel');
    expect(dialogue?.actionLabel).toBe('Přijmout úkol');
  });

  it('upřednostní hlášení předčasného vítězství', () => {
    const quest = advanceQuestAfterBanditDefeat(createInitialQuestState());
    const dialogue = getDialogueForNpc('smith-bohdan', { quest });

    expect(dialogue?.id).toBe('bohdan-report-early-victory');
    expect(applyDialogueEffects(quest, dialogue as DialogueDefinition).step).toBe('complete');
  });

  it('vybere připomínku během aktivního soubojového kroku', () => {
    const quest = advanceQuestAfterDialogue(createInitialQuestState());
    const dialogue = getDialogueForNpc('smith-bohdan', { quest });

    expect(dialogue?.id).toBe('bohdan-remind-first-steel');
    expect(applyDialogueEffects(quest, dialogue as DialogueDefinition)).toBe(quest);
  });

  it('vybere závěrečný dialog po dokončení', () => {
    const active = advanceQuestAfterDialogue(createInitialQuestState());
    const quest = advanceQuestAfterBanditDefeat(active);

    expect(getDialogueForNpc('smith-bohdan', { quest })?.id).toBe(
      'bohdan-first-steel-complete'
    );
  });

  it('vybere Kateřinin nedůvěřivý dialog při nízké měšťanské pověsti', () => {
    const dialogue = getDialogueForNpc('trader-katerina', {
      quest: createInitialQuestState(),
      reputation: { peasants: 0, townsfolk: -20, nobility: 0 }
    });

    expect(dialogue?.id).toBe('katerina-distrusted');
  });

  it('vybere Kateřinin ctěný dialog při vysoké měšťanské pověsti', () => {
    const dialogue = getDialogueForNpc('trader-katerina', {
      quest: createInitialQuestState(),
      reputation: { peasants: 0, townsfolk: 60, nobility: 0 }
    });

    expect(dialogue?.id).toBe('katerina-honored');
  });

  it('neutrální pověst zachová běžný Kateřinin dialog', () => {
    const dialogue = getDialogueForNpc('trader-katerina', {
      quest: createInitialQuestState(),
      reputation: { peasants: 0, townsfolk: 0, nobility: 0 }
    });

    expect(dialogue?.id).toBe('katerina-ambient');
  });

  it('respektuje prioritu dat nezávisle na pořadí pole', () => {
    const low: DialogueDefinition = {
      id: 'low',
      npcId: 'smith-bohdan',
      priority: 1,
      speaker: 'Nízká priorita',
      text: 'Nízká priorita',
      actionLabel: 'Zavřít'
    };
    const high: DialogueDefinition = {
      ...low,
      id: 'high',
      priority: 10,
      speaker: 'Vysoká priorita'
    };

    const selected = getDialogueForNpc(
      'smith-bohdan',
      { quest: createInitialQuestState() },
      [low, high]
    );
    expect(selected?.id).toBe('high');
    expect(DIALOGUE_DEFINITIONS.length).toBeGreaterThanOrEqual(15);
  });
});
