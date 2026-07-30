import { describe, expect, it } from "vitest";

import {
  HorseRuntimeOrchestrator,
  type HorseRuntimeTransition,
} from "../application/HorseRuntimeOrchestrator";
import {
  HorseCommandIds,
  HorseEventIds,
  type HorseRuntimeCommand,
  type HorseRuntimePersistenceBoundary,
  type HorseRuntimeStateSnapshot,
} from "../contracts/horseRuntime";
import { firstHorseQuestContent } from "../data/horseQuestContent";

const baseState = (): HorseRuntimeStateSnapshot => ({
  questId: firstHorseQuestContent.questId,
  horseId: firstHorseQuestContent.horseId,
  worldFlags: {
    "horse.quest.first.started": true,
    "horse.quest.first.solution_choice": false,
    "horse.quest.first.solution_selected": false,
    "horse.quest.first.lawful_service": false,
    "horse.quest.first.covert_release": false,
    "horse.jiskra.inspected": true,
    "horse.jiskra.care_available": true,
    "horse.jiskra.fed": false,
    "horse.jiskra.groomed": false,
    "horse.jiskra.trust_earned": false,
    "horse.jiskra.claimed": false,
    "horse.jiskra.injured": false,
    "horse.jiskra.mount_unlocked": false,
    "horse.jiskra.trial_started": false,
    "horse.jiskra.trial_completed": false,
    "stable.radovesice.access": true,
    "stable.radovesice.gate_repaired": false,
    "stable.radovesice.herbs_delivered": false,
    "stable.radovesice.owner_approved": false,
    "stable.radovesice.gate_opened_covertly": false,
    "stable.radovesice.covert_detected": false,
    "stable.radovesice.owner_hostile": false,
  },
  counters: {
    "horse.jiskra.trust_points": 0,
    "horse.jiskra.trial_checkpoint_index": 0,
  },
  appliedIdempotencyKeys: [],
  selectedSolution: null,
  mountedActorId: null,
  failed: false,
  completed: false,
});

const context = (idempotencyKey: string, actorId = "player.henry") => ({
  questId: firstHorseQuestContent.questId,
  horseId: firstHorseQuestContent.horseId,
  actorId,
  issuedAtTick: 120,
  idempotencyKey,
});

const transition = (
  orchestrator: HorseRuntimeOrchestrator,
  command: HorseRuntimeCommand,
  state: HorseRuntimeStateSnapshot,
  external: Readonly<Record<string, boolean | number | string>> = {},
): HorseRuntimeTransition => {
  const result = orchestrator.execute(command, state, external);
  if (!("state" in result)) throw new Error(`${result.code}: ${result.message}`);
  return result;
};

const interaction = (
  idempotencyKey: string,
  interactionId: string,
  targetId: string,
  solution?: "lawful_service" | "covert_release",
): HorseRuntimeCommand => ({
  id: HorseCommandIds.performInteraction,
  context: context(idempotencyKey),
  interactionId,
  targetId,
  solution,
  idempotency: "once_per_quest",
});

describe("HorseRuntimeOrchestrator", () => {
  it("applies trust completion effects exactly when the progress threshold is crossed", () => {
    const orchestrator = new HorseRuntimeOrchestrator(firstHorseQuestContent);
    const fed = transition(
      orchestrator,
      interaction("feed-1", "interaction.feed_jiskra", firstHorseQuestContent.horseId),
      baseState(),
    );
    const groomed = transition(
      orchestrator,
      interaction("groom-1", "interaction.groom_jiskra", firstHorseQuestContent.horseId),
      fed.state,
    );

    expect(groomed.state.counters["horse.jiskra.trust_points"]).toBe(3);
    expect(groomed.state.worldFlags["horse.jiskra.trust_earned"]).toBe(true);
    expect(groomed.state.worldFlags["horse.quest.first.solution_choice"]).toBe(true);
    expect(groomed.events.at(-1)).toEqual(
      expect.objectContaining({
        id: HorseEventIds.stateEffectsApplied,
        effects: expect.arrayContaining([
          expect.objectContaining({ target: "horse.jiskra.trust_earned", value: true }),
        ]),
      }),
    );
  });

  it("executes the complete lawful acquisition path and emits acquisitionConfirmed", () => {
    const orchestrator = new HorseRuntimeOrchestrator(firstHorseQuestContent);
    const trusted: HorseRuntimeStateSnapshot = {
      ...baseState(),
      worldFlags: {
        ...baseState().worldFlags,
        "horse.jiskra.trust_earned": true,
        "horse.quest.first.solution_choice": true,
      },
      counters: { ...baseState().counters, "horse.jiskra.trust_points": 3 },
    };
    const selected = transition(
      orchestrator,
      { id: HorseCommandIds.selectSolution, context: context("lawful-select"), solution: "lawful_service" },
      trusted,
    );
    const repaired = transition(
      orchestrator,
      interaction(
        "repair-1",
        "interaction.repair_stable_gate",
        "object.radovesice.stable_gate",
        "lawful_service",
      ),
      selected.state,
    );
    const herbs = transition(
      orchestrator,
      interaction(
        "herbs-1",
        "interaction.deliver_stable_herbs",
        "npc.owner_anezka",
        "lawful_service",
      ),
      repaired.state,
    );
    const acquired = transition(
      orchestrator,
      interaction(
        "approval-1",
        "interaction.obtain_owner_approval",
        "npc.owner_anezka",
        "lawful_service",
      ),
      herbs.state,
    );

    expect(selected.state.worldFlags["horse.quest.first.lawful_service"]).toBe(true);
    expect(selected.state.worldFlags["horse.quest.first.solution_selected"]).toBe(true);
    expect(acquired.state.worldFlags["horse.jiskra.claimed"]).toBe(true);
    expect(acquired.events).toContainEqual(
      expect.objectContaining({ id: HorseEventIds.acquisitionConfirmed, solution: "lawful_service" }),
    );
  });

  it("executes the complete covert acquisition path at night", () => {
    const orchestrator = new HorseRuntimeOrchestrator(firstHorseQuestContent);
    const trusted: HorseRuntimeStateSnapshot = {
      ...baseState(),
      worldFlags: {
        ...baseState().worldFlags,
        "horse.jiskra.trust_earned": true,
        "horse.quest.first.solution_choice": true,
      },
      counters: { ...baseState().counters, "horse.jiskra.trust_points": 3 },
    };
    const selected = transition(
      orchestrator,
      { id: HorseCommandIds.selectSolution, context: context("covert-select"), solution: "covert_release" },
      trusted,
    );
    const gate = transition(
      orchestrator,
      interaction(
        "covert-gate",
        "interaction.open_stable_gate_covertly",
        "object.radovesice.stable_gate",
        "covert_release",
      ),
      selected.state,
      { "world.time.phase": "night" },
    );
    const acquired = transition(
      orchestrator,
      interaction(
        "lead-out",
        "interaction.lead_jiskra_out",
        firstHorseQuestContent.horseId,
        "covert_release",
      ),
      gate.state,
      { "world.time.phase": "night" },
    );

    expect(acquired.state.worldFlags["horse.jiskra.claimed"]).toBe(true);
    expect(acquired.state.worldFlags["stable.radovesice.owner_hostile"]).toBe(true);
    expect(acquired.events).toContainEqual(
      expect.objectContaining({ id: HorseEventIds.acquisitionConfirmed, solution: "covert_release" }),
    );
  });

  it("enforces one authoritative mount owner and supports dismount", () => {
    const orchestrator = new HorseRuntimeOrchestrator(firstHorseQuestContent);
    const claimState: HorseRuntimeStateSnapshot = {
      ...baseState(),
      worldFlags: {
        ...baseState().worldFlags,
        "horse.jiskra.claimed": true,
        "horse.jiskra.mount_unlocked": true,
      },
    };
    const mounted = transition(
      orchestrator,
      { id: HorseCommandIds.requestMount, context: context("mount-1") },
      claimState,
    );
    const duplicate = orchestrator.execute(
      { id: HorseCommandIds.requestMount, context: context("mount-2", "player.other") },
      mounted.state,
    );
    const dismounted = transition(
      orchestrator,
      { id: HorseCommandIds.dismount, context: context("dismount-1") },
      mounted.state,
    );

    expect(mounted.state.mountedActorId).toBe("player.henry");
    expect("accepted" in duplicate && duplicate.accepted).toBe(false);
    if ("accepted" in duplicate && !duplicate.accepted) {
      expect(duplicate.code).toBe("horse_already_mounted");
    }
    expect(dismounted.state.mountedActorId).toBeNull();
    expect(dismounted.events).toContainEqual(
      expect.objectContaining({ id: HorseEventIds.dismountConfirmed }),
    );
  });

  it("rejects checkpoints before trial activation", () => {
    const orchestrator = new HorseRuntimeOrchestrator(firstHorseQuestContent);
    const route = firstHorseQuestContent.trialRoute;
    const result = orchestrator.execute(
      {
        id: HorseCommandIds.confirmTrialCheckpoint,
        context: context("checkpoint-before-start"),
        routeId: route.routeId,
        checkpointId: route.checkpointIds[0],
        checkpointIndex: 0,
      },
      baseState(),
    );

    expect("accepted" in result && result.accepted).toBe(false);
    if ("accepted" in result && !result.accepted) expect(result.code).toBe("trial_not_active");
  });

  it("resets the active trial deterministically on wrong checkpoint order", () => {
    const orchestrator = new HorseRuntimeOrchestrator(firstHorseQuestContent);
    const route = firstHorseQuestContent.trialRoute;
    const active: HorseRuntimeStateSnapshot = {
      ...baseState(),
      worldFlags: { ...baseState().worldFlags, "horse.jiskra.trial_started": true },
      counters: { ...baseState().counters, [route.progressCounterId]: 0 },
    };
    const reset = transition(
      orchestrator,
      {
        id: HorseCommandIds.confirmTrialCheckpoint,
        context: context("wrong-order"),
        routeId: route.routeId,
        checkpointId: route.checkpointIds[1],
        checkpointIndex: 1,
      },
      active,
    );

    expect(reset.state.worldFlags["horse.jiskra.trial_started"]).toBe(false);
    expect(reset.state.counters[route.progressCounterId]).toBe(0);
    expect(reset.events).toContainEqual(
      expect.objectContaining({
        id: HorseEventIds.trialResetConfirmed,
        reason: "wrong_checkpoint_order",
      }),
    );
  });

  it("completes start -> three checkpoints -> finish only for the mounted actor", () => {
    const orchestrator = new HorseRuntimeOrchestrator(firstHorseQuestContent);
    const route = firstHorseQuestContent.trialRoute;
    const mounted: HorseRuntimeStateSnapshot = {
      ...baseState(),
      worldFlags: {
        ...baseState().worldFlags,
        "horse.jiskra.claimed": true,
        "horse.jiskra.mount_unlocked": true,
      },
      mountedActorId: "player.henry",
    };
    let current = transition(
      orchestrator,
      interaction("trial-start", route.startInteractionId, firstHorseQuestContent.horseId),
      mounted,
    ).state;
    route.checkpointIds.forEach((checkpointId, checkpointIndex) => {
      current = transition(
        orchestrator,
        {
          id: HorseCommandIds.confirmTrialCheckpoint,
          context: context(`checkpoint-${checkpointIndex}`),
          routeId: route.routeId,
          checkpointId,
          checkpointIndex,
        },
        current,
      ).state;
    });
    const finished = transition(
      orchestrator,
      interaction("trial-finish", route.finishInteractionId, firstHorseQuestContent.stableId),
      current,
    );

    expect(finished.state.worldFlags["horse.jiskra.trial_completed"]).toBe(true);
    expect(finished.state.worldFlags["horse.jiskra.trial_started"]).toBe(false);
    expect(finished.state.completed).toBe(true);
  });

  it("dismount during a trial clears ownership and resets trial state", () => {
    const orchestrator = new HorseRuntimeOrchestrator(firstHorseQuestContent);
    const active: HorseRuntimeStateSnapshot = {
      ...baseState(),
      worldFlags: { ...baseState().worldFlags, "horse.jiskra.trial_started": true },
      counters: { ...baseState().counters, "horse.jiskra.trial_checkpoint_index": 2 },
      mountedActorId: "player.henry",
    };
    const result = transition(
      orchestrator,
      { id: HorseCommandIds.dismount, context: context("dismount-trial") },
      active,
    );

    expect(result.state.mountedActorId).toBeNull();
    expect(result.state.worldFlags["horse.jiskra.trial_started"]).toBe(false);
    expect(result.state.counters["horse.jiskra.trial_checkpoint_index"]).toBe(0);
  });

  it("applies the complete covert failure content effects", () => {
    const orchestrator = new HorseRuntimeOrchestrator(firstHorseQuestContent);
    const covert: HorseRuntimeStateSnapshot = {
      ...baseState(),
      selectedSolution: "covert_release",
      worldFlags: {
        ...baseState().worldFlags,
        "horse.quest.first.covert_release": true,
        "horse.quest.first.solution_selected": true,
      },
    };
    const failed = transition(
      orchestrator,
      {
        id: HorseCommandIds.reportFailure,
        context: context("covert-detected"),
        failureId: "failure.first_horse.covert_detection",
        source: "covert_detection",
      },
      covert,
    );

    expect(failed.state.failed).toBe(true);
    expect(failed.state.worldFlags["stable.radovesice.covert_detected"]).toBe(true);
    expect(failed.state.worldFlags["stable.radovesice.owner_hostile"]).toBe(true);
    expect(failed.events).toContainEqual(
      expect.objectContaining({ id: HorseEventIds.stateEffectsApplied }),
    );
  });

  it("preserves idempotency and round-trips the expanded snapshot through persistence", async () => {
    const orchestrator = new HorseRuntimeOrchestrator(firstHorseQuestContent);
    const fed = transition(
      orchestrator,
      interaction("feed-once", "interaction.feed_jiskra", firstHorseQuestContent.horseId),
      baseState(),
    );
    const duplicate = orchestrator.execute(
      interaction("feed-once", "interaction.feed_jiskra", firstHorseQuestContent.horseId),
      fed.state,
    );
    let persisted: HorseRuntimeStateSnapshot | null = null;
    const boundary: HorseRuntimePersistenceBoundary = {
      load: async () => persisted,
      save: async (snapshot) => {
        persisted = snapshot;
      },
    };

    expect("accepted" in duplicate && duplicate.accepted).toBe(false);
    await orchestrator.save(boundary, fed.state);
    expect(await orchestrator.load(boundary, baseState())).toEqual(fed.state);
  });
});
