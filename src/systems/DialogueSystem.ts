import { getReputationState } from '../core/ReputationStore';
import {
  DIALOGUE_DEFINITIONS,
  type DialogueCondition,
  type DialogueDefinition
} from '../data/dialogues';
import type { NpcId } from '../data/npcs';
import { applyQuestEvent, type QuestState } from './QuestSystem';
import type { ReputationState } from './ReputationSystem';

export interface DialogueContext {
  quest: QuestState;
  reputation?: ReputationState;
}

const matchesCondition = (context: DialogueContext, condition?: DialogueCondition): boolean => {
  if (!condition) return true;
  const { quest } = context;
  const reputation = context.reputation ?? getReputationState();

  if (condition.questId !== undefined && condition.questId !== quest.id) return false;
  if (condition.questSteps && !condition.questSteps.includes(quest.step)) return false;
  if (
    condition.banditDefeated !== undefined &&
    condition.banditDefeated !== quest.banditDefeated
  ) {
    return false;
  }

  if (condition.reputation) {
    const value = reputation[condition.reputation.faction];
    if (condition.reputation.min !== undefined && value < condition.reputation.min) return false;
    if (condition.reputation.max !== undefined && value > condition.reputation.max) return false;
  }

  return true;
};

export const getDialogueDefinitionById = (
  dialogueId: string,
  definitions: readonly DialogueDefinition[] = DIALOGUE_DEFINITIONS
): DialogueDefinition | null =>
  definitions.find((dialogue) => dialogue.id === dialogueId) ?? null;

export const getDialogueForNpc = (
  npcId: NpcId,
  context: DialogueContext,
  definitions: readonly DialogueDefinition[] = DIALOGUE_DEFINITIONS
): DialogueDefinition | null =>
  [...definitions]
    .filter((dialogue) => dialogue.npcId === npcId && matchesCondition(context, dialogue.when))
    .sort((left, right) => right.priority - left.priority)[0] ?? null;

export const applyDialogueEffects = (
  quest: QuestState,
  dialogue: DialogueDefinition
): QuestState =>
  (dialogue.effects ?? []).reduce((state, effect) => {
    switch (effect.type) {
      case 'quest-event':
        return applyQuestEvent(state, effect.event);
    }
  }, quest);
