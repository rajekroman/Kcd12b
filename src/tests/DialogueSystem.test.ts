import { describe, expect, it } from 'vitest';
import { DIALOGUE_DEFINITIONS, type DialogueDefinition } from '../data/dialogues';
import {
  applyDialogueEffects,
  getDialogueDefinitionById,
  getDialogueForNpc
} from '../systems/DialogueSystem';
import {
  advanceQuestAfterBanditDefeat,
  advanceQuestAfterDialogue,
  createInitialQuestState
} from '../systems/QuestSystem';

describe('DialogueSystem', () => {
  it('vybere přísnou nabídku questu pro první rozhovor', () => {
    const dialogue = getDialogueForNpc('smith-bohdan', {
      quest: createInitialQuestState()
    });

    expect(dialogue?.id).toBe('bohdan-offer-first-steel');
    expect(dialogue?.actionLabel).toBe('Přijmout úkol');
    expect(dialogue?.expression).toBe('stern');
  });

  it('upřednostní hrdé hlášení předčasného vítězství', () => {
    const quest = advanceQuestAfterBanditDefeat(createInitialQuestState());
    const dialogue = getDialogueForNpc('smith-bohdan', { quest });

    expect(dialogue?.id).toBe('bohdan-report-early-victory');
    expect(dialogue?.expression).toBe('proud');
    expect(applyDialogueEffects(quest, dialogue as DialogueDefinition).step).toBe('complete');
  });

  it('vybere ustaranou připomínku během aktivního soubojového kroku', () => {
    const quest = advanceQuestAfterDialogue(createInitialQuestState());
    const dialogue = getDialogueForNpc('smith-bohdan', { quest });

    expect(dialogue?.id).toBe('bohdan-remind-first-steel');
    expect(dialogue?.expression).toBe('concerned');
    expect(applyDialogueEffects(quest, dialogue as DialogueDefinition)).toBe(quest);
  });

  it('vybere vlídný závěrečný dialog po dokončení', () => {
    const active = advanceQuestAfterDialogue(createInitialQuestState());
    const quest = advanceQuestAfterBanditDefeat(active);
    const dialogue = getDialogueForNpc('smith-bohdan', { quest });

    expect(dialogue?.id).toBe('bohdan-first-steel-complete');
    expect(dialogue?.expression).toBe('warm');
  });

  it('vybere Kateřinin nedůvěřivý dialog a výraz při nízké pověsti', () => {
    const dialogue = getDialogueForNpc('trader-katerina', {
      quest: createInitialQuestState(),
      reputation: { peasants: 0, townsfolk: -20, nobility: 0 }
    });

    expect(dialogue?.id).toBe('katerina-distrusted');
    expect(dialogue?.expression).toBe('suspicious');
  });

  it('vybere Kateřinin hrdý dialog při vysoké měšťanské pověsti', () => {
    const dialogue = getDialogueForNpc('trader-katerina', {
      quest: createInitialQuestState(),
      reputation: { peasants: 0, townsfolk: 60, nobility: 0 }
    });

    expect(dialogue?.id).toBe('katerina-honored');
    expect(dialogue?.expression).toBe('proud');
  });

  it('neutrální pověst zachová běžný Kateřinin portrét', () => {
    const dialogue = getDialogueForNpc('trader-katerina', {
      quest: createInitialQuestState(),
      reputation: { peasants: 0, townsfolk: 0, nobility: 0 }
    });

    expect(dialogue?.id).toBe('katerina-ambient');
    expect(dialogue?.expression).toBe('neutral');
  });

  it('najde úplný datový uzel podle stabilního dialogue ID', () => {
    const dialogue = getDialogueDefinitionById('agnes-ambient');

    expect(dialogue?.npcId).toBe('herbalist-agnes');
    expect(dialogue?.expression).toBe('suspicious');
    expect(getDialogueDefinitionById('unknown')).toBeNull();
  });

  it('všechny produkční dialogy mají explicitní výraz', () => {
    expect(DIALOGUE_DEFINITIONS.every((dialogue) => dialogue.expression !== undefined)).toBe(true);
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
