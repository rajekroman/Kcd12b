import { describe, expect, it } from "vitest";
import { HorseRuntimeOrchestrator } from "../application/HorseRuntimeOrchestrator";
import type {
  HorseRuntimePersistenceBoundary,
  HorseRuntimeStateSnapshot,
} from "../contracts/horseRuntime";
import { firstHorseQuestContent } from "../data/horseQuestContent";
import { HorseGameplayCoordinator } from "../gameplay/HorseGameplayCoordinator";
import { HorseGameplayRuntime } from "../gameplay/HorseGameplayRuntime";
import { createInitialHorseRuntimeState } from "../gameplay/HorseRuntimeState";

const createBoundary = (
  initial: HorseRuntimeStateSnapshot | null = null,
): HorseRuntimePersistenceBoundary & { read(): HorseRuntimeStateSnapshot | null } => {
  let value = initial;
  return {
    load: async () => value,
    save: async (snapshot) => {
      value = snapshot;
    },
    read: () => value,
  };
};

const createCoordinator = async (initial?: HorseRuntimeStateSnapshot) => {
  const boundary = createBoundary();
  const runtime = new HorseGameplayRuntime({
    orchestrator: new HorseRuntimeOrchestrator(firstHorseQuestContent),
    persistence: boundary,
    initialState: initial ?? createInitialHorseRuntimeState(firstHorseQuestContent),
    externalConditions: () => ({ "world.time.phase": "night" }),
  });
  let tick = 100;
  const coordinator = new HorseGameplayCoordinator({
    runtime,
    content: firstHorseQuestContent,
    actorId: "player.henry",
    nowTick: () => tick++,
  });
  await coordinator.initialize();
  return { coordinator, boundary };
};

const claimedState = (): HorseRuntimeStateSnapshot => {
  const base = createInitialHorseRuntimeState(firstHorseQuestContent);
  return {
    ...base,
    worldFlags: {
      ...base.worldFlags,
      "horse.jiskra.claimed": true,
      "horse.jiskra.mount_unlocked": true,
    },
  };
};

describe("HorseGameplayCoordinator", () => {
  it("keeps mount ownership authoritative and resets an active trial on dismount", async () => {
    const { coordinator } = await createCoordinator(claimedState());

    await coordinator.toggleMount();
    expect(coordinator.getSnapshot().mountedActorId).toBe("player.henry");

    await coordinator.performInteraction("interaction.start_trial_ride");
    expect(coordinator.getSnapshot().worldFlags["horse.jiskra.trial_started"]).toBe(true);

    await coordinator.confirmCheckpoint(
      firstHorseQuestContent.trialRoute.checkpointIds[0],
      0,
    );
    expect(
      coordinator.getSnapshot().counters[firstHorseQuestContent.trialRoute.progressCounterId],
    ).toBe(1);

    await coordinator.toggleMount();
    const snapshot = coordinator.getSnapshot();
    expect(snapshot.mountedActorId).toBeNull();
    expect(snapshot.worldFlags["horse.jiskra.trial_started"]).toBe(false);
    expect(snapshot.counters[firstHorseQuestContent.trialRoute.progressCounterId]).toBe(0);
  });

  it("uses the A1 wrong-order transition to reset trial progress", async () => {
    const active = claimedState();
    const { coordinator } = await createCoordinator({
      ...active,
      mountedActorId: "player.henry",
      worldFlags: {
        ...active.worldFlags,
        "horse.jiskra.trial_started": true,
      },
    });

    const result = await coordinator.confirmCheckpoint(
      firstHorseQuestContent.trialRoute.checkpointIds[1],
      1,
    );
    expect("state" in result).toBe(true);
    expect(coordinator.getSnapshot().worldFlags["horse.jiskra.trial_started"]).toBe(false);
    expect(
      coordinator.getSnapshot().counters[firstHorseQuestContent.trialRoute.progressCounterId],
    ).toBe(0);
  });

  it("publishes terminal pre-claim injury through the declared failure command", async () => {
    const { coordinator, boundary } = await createCoordinator();

    await coordinator.reportFailure(
      "failure.first_horse.pre_claim_injury",
      "stable_hazard",
    );

    expect(coordinator.getSnapshot().failed).toBe(true);
    expect(coordinator.getSnapshot().worldFlags["horse.jiskra.injured"]).toBe(true);
    expect(boundary.read()?.failed).toBe(true);
  });

  it("publishes covert detection effects through the declared failure command", async () => {
    const base = createInitialHorseRuntimeState(firstHorseQuestContent);
    const { coordinator } = await createCoordinator({
      ...base,
      selectedSolution: "covert_release",
      worldFlags: {
        ...base.worldFlags,
        "horse.quest.first.covert_release": true,
      },
    });

    await coordinator.reportFailure(
      "failure.first_horse.covert_detection",
      "covert_detection",
    );

    const snapshot = coordinator.getSnapshot();
    expect(snapshot.failed).toBe(true);
    expect(snapshot.worldFlags["stable.radovesice.covert_detected"]).toBe(true);
    expect(snapshot.worldFlags["stable.radovesice.owner_hostile"]).toBe(true);
  });
});
