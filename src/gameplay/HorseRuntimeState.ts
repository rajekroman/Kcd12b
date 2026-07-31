import type { HorseRuntimeStateSnapshot } from "../contracts/horseRuntime";
import type { HorseQuestContentContract } from "../data/horseQuestContent";

const initialWorldFlags = (content: HorseQuestContentContract): Record<string, boolean> => {
  const flags: Record<string, boolean> = {};

  for (const stage of content.stages) {
    for (const effect of stage.onComplete) {
      if (effect.kind === "set_flag" && typeof effect.value === "boolean") {
        flags[effect.target] ??= false;
      }
    }
  }

  for (const interaction of content.interactions) {
    for (const condition of interaction.requires.conditions) {
      if (condition.source === "world_flag") flags[condition.target] ??= false;
    }
    for (const effect of interaction.effects) {
      if (effect.kind === "set_flag" && typeof effect.value === "boolean") {
        flags[effect.target] ??= false;
      }
    }
  }

  for (const model of content.progressModels) {
    for (const effect of model.completionEffects) {
      if (effect.kind === "set_flag" && typeof effect.value === "boolean") {
        flags[effect.target] ??= false;
      }
    }
  }

  flags["horse.quest.first.started"] = true;
  return flags;
};

export const createInitialHorseRuntimeState = (
  content: HorseQuestContentContract,
): HorseRuntimeStateSnapshot => ({
  questId: content.questId,
  horseId: content.horseId,
  worldFlags: initialWorldFlags(content),
  counters: Object.fromEntries(
    content.progressModels.map((model) => [model.counterId, model.initialValue]),
  ),
  appliedIdempotencyKeys: [],
  selectedSolution: null,
  mountedActorId: null,
  failed: false,
  completed: false,
});
