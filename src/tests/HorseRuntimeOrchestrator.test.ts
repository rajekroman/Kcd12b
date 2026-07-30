import { describe, expect, it } from "vitest";

import { HorseRuntimeOrchestrator } from "../application/HorseRuntimeOrchestrator";
import {
  HorseCommandIds,
  HorseEventIds,
  type HorseRuntimePersistenceBoundary,
  type HorseRuntimeStateSnapshot,
} from "../contracts/horseRuntime";
import { firstHorseQuestContent } from "../data/horseQuestContent";

const baseState = (): HorseRuntimeStateSnapshot => ({
  questId: firstHorseQuestContent.questId,
  horseId: firstHorseQuestContent.horseId,
  worldFlags: {
    "horse.quest.first.started": true,
    "horse.jiskra.care_available": true,
    "horse.jiskra.fed": false,
    "horse.jiskra.groomed": false,
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
    expect(result.state.worldFlags["horse.jiskra.fed"]).toBe(true);
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

  it("confirms mount only after claim and unlock", () => {
    const orchestrator = new HorseRuntimeOrchestrator(firstHorseQuestContent);
    const state: HorseRuntimeStateSnapshot = {
      ...baseState(),
      worldFlags: {
        ...baseState().worldFlags,
        "horse.jiskra.claimed": true,
        "horse.jiskra.mount_unlocked": true,
      },
    };

    const result = orchestrator.execute(
      { id: HorseCommandIds.requestMount, context: context("mount-1") },
      state,
    );

    expect("state" in result).toBe(true);
    if (!("state" in result)) return;
    expect(result.events).toContainEqual(
      expect.objectContaining({ id: HorseEventIds.mountConfirmed }),
    );
  });

  it("rejects mount before the horse is claimed", () => {
    const orchestrator = new HorseRuntimeOrchestrator(firstHorseQuestContent);
    const result = orchestrator.execute(
      { id: HorseCommandIds.requestMount, context: context("mount-too-early") },
      baseState(),
    );

    expect("accepted" in result && result.accepted).toBe(false);
    if (!("accepted" in result) || result.accepted) return;
    expect(result.code).toBe("horse_not_claimed");
  });

  it("confirms trial checkpoints only in declared order", () => {
    const orchestrator = new HorseRuntimeOrchestrator(firstHorseQuestContent);
    const route = firstHorseQuestContent.trialRoute;
    const result = orchestrator.execute(
      {
        id: HorseCommandIds.confirmTrialCheckpoint,
        context: context("checkpoint-0"),
        routeId: route.routeId,
        checkpointId: route.checkpointIds[0],
        checkpointIndex: 0,
      },
      baseState(),
    );

    expect("state" in result).toBe(true);
    if (!("state" in result)) return;
    expect(result.state.counters[route.progressCounterId]).toBe(1);
    expect(result.events).toContainEqual(
      expect.objectContaining({
        id: HorseEventIds.trialCheckpointConfirmed,
        checkpointIndex: 0,
        nextCheckpointIndex: 1,
      }),
    );
  });

  it("rejects a checkpoint with the wrong order", () => {
    const orchestrator = new HorseRuntimeOrchestrator(firstHorseQuestContent);
    const route = firstHorseQuestContent.trialRoute;
    const result = orchestrator.execute(
      {
        id: HorseCommandIds.confirmTrialCheckpoint,
        context: context("checkpoint-wrong"),
        routeId: route.routeId,
        checkpointId: route.checkpointIds[1],
        checkpointIndex: 1,
      },
      baseState(),
    );

    expect("accepted" in result && result.accepted).toBe(false);
    if (!("accepted" in result) || result.accepted) return;
    expect(result.code).toBe("wrong_trial_checkpoint");
  });

  it("resets trial progress deterministically", () => {
    const orchestrator = new HorseRuntimeOrchestrator(firstHorseQuestContent);
    const route = firstHorseQuestContent.trialRoute;
    const state: HorseRuntimeStateSnapshot = {
      ...baseState(),
      counters: { ...baseState().counters, [route.progressCounterId]: 2 },
    };
    const result = orchestrator.execute(
      {
        id: HorseCommandIds.resetTrial,
        context: context("trial-reset-1"),
        routeId: route.routeId,
        reason: "route_left",
      },
      state,
    );

    expect("state" in result).toBe(true);
    if (!("state" in result)) return;
    expect(result.state.counters[route.progressCounterId]).toBe(0);
    expect(result.events).toContainEqual(
      expect.objectContaining({ id: HorseEventIds.trialResetConfirmed, nextCheckpointIndex: 0 }),
    );
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

  it("round-trips a snapshot through the persistence boundary without changing save schema", async () => {
    const orchestrator = new HorseRuntimeOrchestrator(firstHorseQuestContent);
    let persisted: HorseRuntimeStateSnapshot | null = null;
    const boundary: HorseRuntimePersistenceBoundary = {
      load: async () => persisted,
      save: async (snapshot) => {
        persisted = snapshot;
      },
    };
    const snapshot = baseState();

    await orchestrator.save(boundary, snapshot);
    const loaded = await orchestrator.load(boundary, {
      ...snapshot,
      failed: true,
    });

    expect(loaded).toEqual(snapshot);
  });
});
