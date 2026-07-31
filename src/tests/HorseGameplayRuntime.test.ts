import { describe, expect, it } from "vitest";

import { HorseRuntimeOrchestrator } from "../application/HorseRuntimeOrchestrator";
import {
  HorseCommandIds,
  HorseEventIds,
  type HorseRuntimePersistenceBoundary,
  type HorseRuntimeStateSnapshot,
} from "../contracts/horseRuntime";
import { firstHorseQuestContent } from "../data/horseQuestContent";
import { HorseGameplayRuntime } from "../gameplay/HorseGameplayRuntime";

const createState = (
  overrides: Partial<HorseRuntimeStateSnapshot> = {},
): HorseRuntimeStateSnapshot => ({
  questId: firstHorseQuestContent.questId,
  horseId: firstHorseQuestContent.horseId,
  worldFlags: {
    "horse.quest.first.started": true,
    "horse.jiskra.claimed": true,
    "horse.jiskra.mount_unlocked": true,
    "horse.jiskra.trial_completed": false,
  },
  counters: {
    "horse.jiskra.trust_points": 3,
    "horse.jiskra.trial_checkpoint_index": 0,
  },
  appliedIdempotencyKeys: [],
  selectedSolution: "lawful_service",
  mountedActorId: null,
  failed: false,
  completed: false,
  ...overrides,
});

const context = (idempotencyKey: string) => ({
  questId: firstHorseQuestContent.questId,
  horseId: firstHorseQuestContent.horseId,
  actorId: "player.henry",
  issuedAtTick: 10,
  idempotencyKey,
});

describe("HorseGameplayRuntime", () => {
  it("loads the persisted snapshot once and exposes it as authoritative state", async () => {
    const persisted = createState({ mountedActorId: "player.henry" });
    let loads = 0;
    const persistence: HorseRuntimePersistenceBoundary = {
      load: async () => {
        loads += 1;
        return persisted;
      },
      save: async () => undefined,
    };
    const runtime = new HorseGameplayRuntime({
      orchestrator: new HorseRuntimeOrchestrator(firstHorseQuestContent),
      persistence,
      initialState: createState(),
    });

    expect(await runtime.initialize()).toEqual(persisted);
    expect(await runtime.initialize()).toEqual(persisted);
    expect(runtime.getSnapshot()).toEqual(persisted);
    expect(loads).toBe(1);
  });

  it("persists an accepted transition before publishing confirmed events", async () => {
    const writes: HorseRuntimeStateSnapshot[] = [];
    const order: string[] = [];
    const persistence: HorseRuntimePersistenceBoundary = {
      load: async () => null,
      save: async (snapshot) => {
        writes.push(snapshot);
        order.push("saved");
      },
    };
    const runtime = new HorseGameplayRuntime({
      orchestrator: new HorseRuntimeOrchestrator(firstHorseQuestContent),
      persistence,
      initialState: createState(),
    });
    runtime.subscribe((event) => order.push(event.id));
    await runtime.initialize();

    const result = await runtime.dispatch({
      id: HorseCommandIds.requestMount,
      context: context("mount-1"),
    });

    expect("state" in result).toBe(true);
    expect(writes).toHaveLength(1);
    expect(writes[0].mountedActorId).toBe("player.henry");
    expect(runtime.getSnapshot().mountedActorId).toBe("player.henry");
    expect(order).toEqual(["saved", HorseEventIds.mountConfirmed]);
  });

  it("does not persist or publish rejected commands", async () => {
    let writes = 0;
    let events = 0;
    const persistence: HorseRuntimePersistenceBoundary = {
      load: async () => null,
      save: async () => {
        writes += 1;
      },
    };
    const runtime = new HorseGameplayRuntime({
      orchestrator: new HorseRuntimeOrchestrator(firstHorseQuestContent),
      persistence,
      initialState: createState({
        worldFlags: {
          "horse.quest.first.started": true,
          "horse.jiskra.claimed": false,
          "horse.jiskra.mount_unlocked": false,
          "horse.jiskra.trial_completed": false,
        },
      }),
    });
    runtime.subscribe(() => {
      events += 1;
    });
    await runtime.initialize();

    const result = await runtime.dispatch({
      id: HorseCommandIds.requestMount,
      context: context("mount-too-early"),
    });

    expect("accepted" in result && result.accepted).toBe(false);
    expect(writes).toBe(0);
    expect(events).toBe(0);
    expect(runtime.getSnapshot().mountedActorId).toBeNull();
  });

  it("requires initialization before accepting gameplay commands", async () => {
    const runtime = new HorseGameplayRuntime({
      orchestrator: new HorseRuntimeOrchestrator(firstHorseQuestContent),
      persistence: { load: async () => null, save: async () => undefined },
      initialState: createState(),
    });

    await expect(
      runtime.dispatch({ id: HorseCommandIds.requestMount, context: context("mount-before-init") }),
    ).rejects.toThrow("must be initialized");
  });
});
