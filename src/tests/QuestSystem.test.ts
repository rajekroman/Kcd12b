import { describe, expect, it } from 'vitest';
import {
  advanceQuestAfterBanditDefeat,
  advanceQuestAfterDialogue,
  applyQuestEvent,
  createInitialQuestState,
  getQuestDefinition,
  getQuestObjective
} from '../systems/QuestSystem';

describe('QuestSystem', () => {
  it('vytvoří počáteční stav z definice questu', () => {
    const definition = getQuestDefinition('first-steel');
    const initial = createInitialQuestState();

    expect(definition.title).toBe('První ocel');
    expect(initial).toEqual(definition.initialState);
    expect(initial).not.toBe(definition.initialState);
  });

  it('postupuje podle datových přechodů od rozhovoru k souboji a dokončení', () => {
    const initial = createInitialQuestState();
    const accepted = applyQuestEvent(initial, 'smith-dialogue');
    const complete = applyQuestEvent(accepted, 'bandit-defeated');

    expect(accepted.step).toBe('defeat-bandit');
    expect(complete.step).toBe('complete');
    expect(complete.banditDefeated).toBe(true);
    expect(getQuestObjective(complete)).toContain('dokončen');
  });

  it('zachovává kompatibilní veřejné pomocné funkce', () => {
    const accepted = advanceQuestAfterDialogue(createInitialQuestState());
    const complete = advanceQuestAfterBanditDefeat(accepted);

    expect(complete.step).toBe('complete');
  });

  it('nezablokuje úkol, když hráč porazí lapku před rozhovorem', () => {
    const initial = createInitialQuestState();
    const defeatedEarly = advanceQuestAfterBanditDefeat(initial);
    const completedAfterDialogue = advanceQuestAfterDialogue(defeatedEarly);

    expect(defeatedEarly.step).toBe('meet-smith');
    expect(defeatedEarly.banditDefeated).toBe(true);
    expect(getQuestObjective(defeatedEarly)).toContain('poraženém lapkovi');
    expect(completedAfterDialogue.step).toBe('complete');
  });

  it('ignoruje událost bez odpovídajícího přechodu', () => {
    const complete = {
      ...createInitialQuestState(),
      step: 'complete' as const,
      banditDefeated: true
    };

    expect(applyQuestEvent(complete, 'bandit-defeated')).toBe(complete);
  });
});
