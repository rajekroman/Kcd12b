import { describe, expect, it } from "vitest";

import { HorseRuntimeOrchestrator } from "../application/HorseRuntimeOrchestrator";
import {
  HorseCommandIds,
  HorseEventIds,
  type HorseRuntimeStateSnapshot,
} from "../contracts/horseRuntime";
import { firstHorseQuestContent } from "../data/horseQuestContent";

const baseState = (): HorseRuntimeStateSnapshot => ({
  questId: firstHorseQuestContent.questId,
  horseId: firstHorseQuestContent.horseId,
  worldFlags: {
    "horse.quest.first.started": true,
    "horse.jiskra.care_available": true,
    "horse.jiskra.claimed": false,
    "horse.jiskra.mount_unlocked": false,
    "horse.jiskra.trial_completed": false,
    "stable.radovesice.gate_repaired": false,
    "stable.radovesice.herbs_delivered": false,
    "stable.radovesice.owner_approved": false,
    "stable.radovesice.covert_detected": false,
  },
  counters: {
    "horse.jiskra.trust_points": 0,
    "horse.jiskra.trial_checkpoint_index": 0,
  },
  appliedIdempotencyKeys: [],
  selectedSolution: null,
  failed: false,
  completed: false,
});

const context = (idempotencyKey: string) => ({
  questId: firstHorseQuestContent.questId,
  horseId: firstHorseQuestContent.horseId,
  actorId: "player.henry",
  issuedAtTick: 120,
  idempotencyKey,
});

describe("HorseRuntimeOrchestrator", () => {
  it("executes a declared interaction as command -> confirmed event -> state effect", () => {
    const orchestrator = new HorseRuntimeOrchestrator(firstHorseQuestContent);
    const result = orchestrator.execute(
      {
        id: HorseCommandIds.performInteraction,
        context: context("feed-jiskra-1"),
        interactionId: "interaction.feed_jiskra",
        targetId: firstHorseQuestContent.horseId,
        idempotency: "once_per_quest",
      },
      baseState(),
    );

    expect("state" in result).toBe(true);
    if (!("state" in result)) return;

    expect(result.events.map((event) => event.id)).toEqual([
      HorseEventIds.interactionConfirmed,
      HorseEventIds.stateEffectsApplied,
    ]);
    expect(result.state.counters["horse.jiskra.trust_points"]).toBe(1);
    expect(result.state.appliedIdempotencyKeys).toContain("feed-jiskra-1");
  });

  it("rejects a repeated idempotency key without applying effects twice", () => {
    const orchestrator = new HorseRuntimeOrchestrator(firstHorseQuestContent);
    const state = {
      ...baseState(),
      counters: { ...baseState().counters, "horse.jiskra.trust_points": 1 },
      appliedIdempotencyKeys: ["feed-jiskra-1"],
    };

    const result = orchestrator.execute(
      {
        id: HorseCommandIds.performInteraction,
        context: context("feed-jiskra-1"),
        interactionId: "interaction.feed_jiskra",
        targetId: firstHorseQuestContent.horseId,
        idempotency: "once_per_quest",
      },
      state,
    );

    expect("accepted" in result && result.accepted).toBe(false);
    if (!("accepted" in result) || result.accepted) return;
    expect(result.code).toBe("duplicate_idempotency_key");
    expect(state.counters["horse.jiskra.trust_points"]).toBe(1);
  });

  it("prevents a confirmed failure from invalidating a completed quest", () => {
    const orchestrator = new HorseRuntimeOrchestrator(firstHorseQuestContent);
    const completedState: HorseRuntimeStateSnapshot = {
      ...baseState(),
      worldFlags: {
        ...baseState().worldFlags,
        "horse.jiskra.claimed": true,
        "horse.jiskra.trial_completed": true,
      },
      completed: true,
    };

    const result = orchestrator.execute(
      {
        id: HorseCommandIds.reportFailure,
        context: context("late-injury"),
        failureId: "failure.first_horse.pre_claim_injury",
        source: "stable_hazard",
      },
      completedState,
    );

    expect("accepted" in result && result.accepted).toBe(false);
    if (!("accepted" in result) || result.accepted) return;
    expect(result.code).toBe("quest_completed");
    expect(completedState.failed).toBe(false);
  });

  it("confirms a valid pre-claim failure as a terminal event", () => {
    const orchestrator = new HorseRuntimeOrchestrator(firstHorseQuestContent);
    const result = orchestrator.execute(
      {
        id: HorseCommandIds.reportFailure,
        context: context("injury-before-claim"),
        failureId: "failure.first_horse.pre_claim_injury",
        source: "stable_hazard",
      },
      baseState(),
    );

    expect("state" in result).toBe(true);
    if (!("state" in result)) return;
    expect(result.events).toContainEqual(
      expect.objectContaining({
        id: HorseEventIds.questFailureConfirmed,
        failureId: "failure.first_horse.pre_claim_injury",
        terminal: true,
      }),
    );
    expect(result.state.failed).toBe(true);
  });
});
