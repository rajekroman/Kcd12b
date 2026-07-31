import { describe, expect, it } from "vitest";

import { firstHorseQuestContent } from "../data/horseQuestContent";
import { createInitialHorseRuntimeState } from "../gameplay/HorseRuntimeState";
import {
  HORSE_RUNTIME_STORAGE_KEY,
  HorseRuntimeStorage,
} from "../gameplay/HorseRuntimeStorage";

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

describe("horse runtime persistence adapters", () => {
  it("creates a deterministic initial snapshot from the content contract", () => {
    const snapshot = createInitialHorseRuntimeState(firstHorseQuestContent);

    expect(snapshot.questId).toBe(firstHorseQuestContent.questId);
    expect(snapshot.horseId).toBe(firstHorseQuestContent.horseId);
    expect(snapshot.worldFlags["horse.quest.first.started"]).toBe(true);
    expect(snapshot.worldFlags["horse.jiskra.claimed"]).toBe(false);
    expect(snapshot.counters["horse.jiskra.trust_points"]).toBe(0);
    expect(snapshot.mountedActorId).toBeNull();
  });

  it("round-trips a snapshot through the namespaced storage key", async () => {
    const storage = new MemoryStorage();
    const boundary = new HorseRuntimeStorage(storage);
    const snapshot = createInitialHorseRuntimeState(firstHorseQuestContent);

    await boundary.save(snapshot);

    expect(storage.getItem(HORSE_RUNTIME_STORAGE_KEY)).not.toBeNull();
    await expect(boundary.load()).resolves.toEqual(snapshot);
  });

  it("ignores malformed or incompatible stored values", async () => {
    const storage = new MemoryStorage();
    const boundary = new HorseRuntimeStorage(storage);

    storage.setItem(HORSE_RUNTIME_STORAGE_KEY, "not-json");
    await expect(boundary.load()).resolves.toBeNull();

    storage.setItem(HORSE_RUNTIME_STORAGE_KEY, JSON.stringify({ questId: "incomplete" }));
    await expect(boundary.load()).resolves.toBeNull();
  });
});
