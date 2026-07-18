import { describe, expect, it } from 'vitest';
import {
  advanceQuestAfterBanditDefeat,
  advanceQuestAfterDialogue,
  createInitialQuestState,
  getQuestObjective
} from '../systems/QuestSystem';

describe('QuestSystem', () => {
  it('postupuje od rozhovoru k souboji a dokončení', () => {
    const initial = createInitialQuestState();
    const accepted = advanceQuestAfterDialogue(initial);
    const complete = advanceQuestAfterBanditDefeat(accepted);

    expect(accepted.step).toBe('defeat-bandit');
    expect(complete.step).toBe('complete');
    expect(complete.banditDefeated).toBe(true);
    expect(getQuestObjective(complete)).toContain('dokončen');
  });
});
