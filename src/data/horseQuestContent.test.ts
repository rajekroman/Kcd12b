import { describe, expect, it } from "vitest";

import {
  firstHorseQuestContent,
  type ContentCondition,
  type ContentConditionSet,
  type ContentEffect,
} from "./horseQuestContent";

const duplicateValues = (values: readonly string[]): string[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }

  return [...duplicates];
};

const conditionsFrom = (...sets: readonly (ContentConditionSet | undefined)[]): ContentCondition[] =>
  sets.flatMap((set) => set?.conditions ?? []);

const allConditions = (): ContentCondition[] => [
  ...firstHorseQuestContent.stages.flatMap((stage) =>
    conditionsFrom(stage.startWhen, stage.completeWhen),
  ),
  ...firstHorseQuestContent.dialogues.flatMap((node) =>
    node.choices.flatMap((choice) => conditionsFrom(choice.requires)),
  ),
  ...firstHorseQuestContent.interactions.flatMap((interaction) =>
    conditionsFrom(interaction.requires),
  ),
  ...firstHorseQuestContent.events.flatMap((event) => conditionsFrom(event.requires)),
  ...firstHorseQuestContent.failures.flatMap((failure) =>
    conditionsFrom(failure.activeWhen, failure.ignoredWhen),
  ),
];

const allEffects = (): ContentEffect[] => [
  ...firstHorseQuestContent.stages.flatMap((stage) => stage.onComplete),
  ...firstHorseQuestContent.dialogues.flatMap((node) =>
    node.choices.flatMap((choice) => choice.effects),
  ),
  ...firstHorseQuestContent.interactions.flatMap((interaction) => interaction.effects),
  ...firstHorseQuestContent.progressModels.flatMap((model) => model.completionEffects),
  ...firstHorseQuestContent.events.flatMap((event) => event.effects),
];

describe("firstHorseQuestContent", () => {
  it("uses unique identifiers across every registry", () => {
    expect(duplicateValues(firstHorseQuestContent.stages.map((stage) => stage.id))).toEqual([]);
    expect(duplicateValues(firstHorseQuestContent.dialogues.map((node) => node.id))).toEqual([]);
    expect(
      duplicateValues(
        firstHorseQuestContent.dialogues.flatMap((node) => node.choices.map((choice) => choice.id)),
      ),
    ).toEqual([]);
    expect(
      duplicateValues(
        firstHorseQuestContent.interactions.map((interaction) => interaction.interactionId),
      ),
    ).toEqual([]);
    expect(
      duplicateValues(
        firstHorseQuestContent.interactions.map((interaction) => interaction.confirmedEventId),
      ),
    ).toEqual([]);
    expect(duplicateValues(firstHorseQuestContent.events.map((event) => event.eventId))).toEqual([]);
    expect(duplicateValues(firstHorseQuestContent.failures.map((failure) => failure.id))).toEqual([]);
    expect(duplicateValues(firstHorseQuestContent.trialRoute.checkpointIds)).toEqual([]);
  });

  it("keeps NPC, dialogue and interaction references resolvable", () => {
    const dialogueIds = new Set(firstHorseQuestContent.dialogues.map((node) => node.id));
    const interactionIds = new Set(
      firstHorseQuestContent.interactions.map((interaction) => interaction.interactionId),
    );

    for (const dialogue of firstHorseQuestContent.dialogues) {
      expect(firstHorseQuestContent.npcIds).toContain(dialogue.speakerId);

      for (const choice of dialogue.choices) {
        if (choice.nextNodeId) {
          expect(dialogueIds.has(choice.nextNodeId)).toBe(true);
        }
        if (choice.interactionId) {
          expect(interactionIds.has(choice.interactionId)).toBe(true);
        }
      }
    }
  });

  it("declares every flag, counter and external condition target", () => {
    const declaredFlags = new Set(firstHorseQuestContent.worldFlags);
    const declaredCounters = new Set(firstHorseQuestContent.counters);
    const declaredExternalTargets = new Set(firstHorseQuestContent.externalConditionTargets);

    const conditions = allConditions();
    const effects = allEffects();

    expect(
      conditions
        .filter((condition) => condition.source === "world_flag")
        .map((condition) => condition.target)
        .filter((target) => !declaredFlags.has(target)),
    ).toEqual([]);
    expect(
      effects
        .filter((effect) => effect.kind === "set_flag")
        .map((effect) => effect.target)
        .filter((target) => !declaredFlags.has(target)),
    ).toEqual([]);
    expect(
      conditions
        .filter((condition) => condition.source === "counter")
        .map((condition) => condition.target)
        .filter((target) => !declaredCounters.has(target)),
    ).toEqual([]);
    expect(
      effects
        .filter(
          (effect) => effect.kind === "set_counter" || effect.kind === "increment_counter",
        )
        .map((effect) => effect.target)
        .filter((target) => !declaredCounters.has(target)),
    ).toEqual([]);
    expect(
      conditions
        .filter((condition) => condition.source === "external")
        .map((condition) => condition.target)
        .filter((target) => !declaredExternalTargets.has(target)),
    ).toEqual([]);
  });

  it("defines a traversable stage graph with explicit terminal states", () => {
    const stages = new Map(firstHorseQuestContent.stages.map((stage) => [stage.id, stage]));
    const visited = new Set<string>();
    const pending = ["not_started"];

    while (pending.length > 0) {
      const stageId = pending.pop();
      if (!stageId || visited.has(stageId)) {
        continue;
      }
      visited.add(stageId);
      const stage = stages.get(stageId as keyof typeof stages);
      expect(stage).toBeDefined();
      pending.push(...(stage?.nextStageIds ?? []));
    }

    for (const stage of firstHorseQuestContent.stages) {
      for (const nextStageId of stage.nextStageIds) {
        expect(stages.has(nextStageId)).toBe(true);
      }
      if (stage.terminal) {
        expect(stage.nextStageIds).toEqual([]);
      } else {
        expect(stage.nextStageIds.length).toBeGreaterThan(0);
      }
    }

    expect(visited.has("completed")).toBe(true);
    expect(firstHorseQuestContent.failures.every((failure) => failure.terminalStageId === "failed"))
      .toBe(true);
  });

  it("provides a producer for every non-terminal stage completion condition", () => {
    const producedTargets = new Set(
      allEffects()
        .filter(
          (effect) =>
            effect.kind === "set_flag" ||
            effect.kind === "set_counter" ||
            effect.kind === "increment_counter",
        )
        .map((effect) => effect.target),
    );

    for (const stage of firstHorseQuestContent.stages.filter((candidate) => !candidate.terminal)) {
      for (const condition of stage.completeWhen.conditions) {
        expect(producedTargets.has(condition.target)).toBe(true);
      }
    }
  });

  it("makes both acquisition solutions independently claim Jiskra", () => {
    const lawfulInteractions = firstHorseQuestContent.interactions.filter(
      (interaction) => interaction.solution === "lawful_service",
    );
    const covertInteractions = firstHorseQuestContent.interactions.filter(
      (interaction) => interaction.solution === "covert_release",
    );

    expect(
      lawfulInteractions.some((interaction) =>
        interaction.effects.some(
          (effect) =>
            effect.kind === "set_flag" &&
            effect.target === "horse.jiskra.claimed" &&
            effect.value === true,
        ),
      ),
    ).toBe(true);
    expect(
      covertInteractions.some((interaction) =>
        interaction.effects.some(
          (effect) =>
            effect.kind === "set_flag" &&
            effect.target === "horse.jiskra.claimed" &&
            effect.value === true,
        ),
      ),
    ).toBe(true);

    const approval = lawfulInteractions.find(
      (interaction) => interaction.interactionId === "interaction.obtain_owner_approval",
    );
    expect(approval?.requires.conditions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ target: "stable.radovesice.gate_repaired", value: true }),
        expect.objectContaining({ target: "stable.radovesice.herbs_delivered", value: true }),
      ]),
    );

    const covertGate = covertInteractions.find(
      (interaction) => interaction.interactionId === "interaction.open_stable_gate_covertly",
    );
    expect(covertGate?.requires.conditions).toContainEqual({
      source: "external",
      target: "world.time.phase",
      operator: "equals",
      value: "night",
    });
  });

  it("uses a deterministic non-farmable trust model", () => {
    const trust = firstHorseQuestContent.progressModels.find(
      (model) => model.counterId === "horse.jiskra.trust_points",
    );
    expect(trust).toBeDefined();
    expect(trust?.contributions.reduce((sum, contribution) => sum + contribution.amount, 0)).toBe(
      trust?.threshold,
    );

    for (const contribution of trust?.contributions ?? []) {
      const interaction = firstHorseQuestContent.interactions.find(
        (candidate) => candidate.interactionId === contribution.interactionId,
      );
      expect(interaction?.idempotency).toBe("once_per_quest");
      expect(interaction?.effects).toContainEqual({
        kind: "increment_counter",
        target: trust?.counterId,
        value: contribution.amount,
      });
    }
  });

  it("defines an ordered and resettable three-checkpoint trial route", () => {
    const route = firstHorseQuestContent.trialRoute;
    expect(route.checkpointIds).toHaveLength(3);

    route.checkpointIds.forEach((checkpointId, index) => {
      const interaction = firstHorseQuestContent.interactions.find(
        (candidate) => candidate.targetId === checkpointId,
      );
      expect(interaction?.requires.conditions).toContainEqual({
        source: "counter",
        target: route.progressCounterId,
        operator: "equals",
        value: index,
      });
      expect(interaction?.effects).toContainEqual({
        kind: "set_counter",
        target: route.progressCounterId,
        value: index + 1,
      });
    });

    const finish = firstHorseQuestContent.interactions.find(
      (interaction) => interaction.interactionId === route.finishInteractionId,
    );
    expect(finish?.requires.conditions).toContainEqual({
      source: "counter",
      target: route.progressCounterId,
      operator: "equals",
      value: route.checkpointIds.length,
    });

    for (const resetEventId of route.resetEventIds) {
      const resetEvent = firstHorseQuestContent.events.find(
        (event) => event.eventId === resetEventId,
      );
      expect(resetEvent?.effects).toContainEqual({
        kind: "set_counter",
        target: route.progressCounterId,
        value: 0,
      });
    }
  });

  it("binds failures to confirmed events and stops applying injury after claim", () => {
    const eventIds = new Set(firstHorseQuestContent.events.map((event) => event.eventId));

    for (const failure of firstHorseQuestContent.failures) {
      expect(eventIds.has(failure.confirmedEventId)).toBe(true);
    }

    const injuryFailure = firstHorseQuestContent.failures.find(
      (failure) => failure.id === "failure.first_horse.pre_claim_injury",
    );
    expect(injuryFailure?.activeWhen.conditions).toContainEqual(
      expect.objectContaining({ target: "horse.jiskra.claimed", value: false }),
    );
    expect(injuryFailure?.ignoredWhen.conditions).toContainEqual(
      expect.objectContaining({ target: "horse.jiskra.claimed", value: true }),
    );

    const injuryEvent = firstHorseQuestContent.events.find(
      (event) => event.eventId === injuryFailure?.confirmedEventId,
    );
    expect(injuryEvent?.payload.find((field) => field.name === "source")?.allowedValues).toEqual([
      "care_mishap",
      "stable_hazard",
    ]);
  });
});
