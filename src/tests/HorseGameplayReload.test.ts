import { describe, expect, it } from "vitest";
import { HorseRuntimeOrchestrator } from "../application/HorseRuntimeOrchestrator";
import { firstHorseQuestContent } from "../data/horseQuestContent";
import { HorseGameplayCoordinator } from "../gameplay/HorseGameplayCoordinator";
import { HorseGameplayRuntime } from "../gameplay/HorseGameplayRuntime";
import { createInitialHorseRuntimeState } from "../gameplay/HorseRuntimeState";
import { HorseRuntimeStorage } from "../gameplay/HorseRuntimeStorage";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  public get length(): number {
    return this.values.size;
  }

  public clear(): void {
    this.values.clear();
  }

  public getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  public key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  public removeItem(key: string): void {
    this.values.delete(key);
  }

  public setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

const createCoordinator = async (storage: Storage, startingTick: number) => {
  const runtime = new HorseGameplayRuntime({
    orchestrator: new HorseRuntimeOrchestrator(firstHorseQuestContent),
    persistence: new HorseRuntimeStorage(storage),
    initialState: createInitialHorseRuntimeState(firstHorseQuestContent),
    externalConditions: () => ({ "world.time.phase": "night" }),
  });
  let tick = startingTick;
  const coordinator = new HorseGameplayCoordinator({
    runtime,
    content: firstHorseQuestContent,
    actorId: "player.henry",
    nowTick: () => tick++,
  });
  await coordinator.initialize();
  return coordinator;
};

describe("horse gameplay persistence reload", () => {
  it("restores lawful acquisition, mount ownership and active trial without replaying rewards", async () => {
    const storage = new MemoryStorage();
    const first = await createCoordinator(storage, 100);

    await first.performInteraction("interaction.inspect_jiskra");
    await first.performInteraction("interaction.feed_jiskra");
    await first.performInteraction("interaction.groom_jiskra");
    await first.selectSolution("lawful_service");
    await first.performInteraction("interaction.repair_stable_gate");
    await first.performInteraction("interaction.deliver_stable_herbs");
    await first.performInteraction("interaction.obtain_owner_approval");
    await first.toggleMount();
    await first.performInteraction("interaction.start_trial_ride");
    await first.confirmCheckpoint(firstHorseQuestContent.trialRoute.checkpointIds[0], 0);

    const beforeReload = first.getSnapshot();
    expect(beforeReload.worldFlags["horse.jiskra.claimed"]).toBe(true);
    expect(beforeReload.mountedActorId).toBe("player.henry");
    expect(beforeReload.counters["horse.jiskra.trust_points"]).toBe(3);
    expect(beforeReload.counters["horse.jiskra.trial_checkpoint_index"]).toBe(1);

    const restored = await createCoordinator(storage, 1000);
    const afterReload = restored.getSnapshot();
    expect(afterReload).toEqual(beforeReload);

    const repeatedFeed = await restored.performInteraction("interaction.feed_jiskra");
    expect("accepted" in repeatedFeed && repeatedFeed.accepted).toBe(false);
    expect(restored.getSnapshot().counters["horse.jiskra.trust_points"]).toBe(3);
    expect(restored.getSnapshot().appliedIdempotencyKeys).toEqual(
      beforeReload.appliedIdempotencyKeys,
    );
  });
});
