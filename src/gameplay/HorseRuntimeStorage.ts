import type {
  HorseRuntimePersistenceBoundary,
  HorseRuntimeStateSnapshot,
} from "../contracts/horseRuntime";

export const HORSE_RUNTIME_STORAGE_KEY = "chronicles.horse-runtime.v1";

const isSnapshot = (value: unknown): value is HorseRuntimeStateSnapshot => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<HorseRuntimeStateSnapshot>;
  return (
    typeof candidate.questId === "string" &&
    typeof candidate.horseId === "string" &&
    !!candidate.worldFlags &&
    typeof candidate.worldFlags === "object" &&
    !!candidate.counters &&
    typeof candidate.counters === "object" &&
    Array.isArray(candidate.appliedIdempotencyKeys) &&
    (candidate.selectedSolution === null || typeof candidate.selectedSolution === "string") &&
    (candidate.mountedActorId === null || typeof candidate.mountedActorId === "string") &&
    typeof candidate.failed === "boolean" &&
    typeof candidate.completed === "boolean"
  );
};

export class HorseRuntimeStorage implements HorseRuntimePersistenceBoundary {
  public constructor(
    private readonly storage: Storage,
    private readonly key = HORSE_RUNTIME_STORAGE_KEY,
  ) {}

  public async load(): Promise<HorseRuntimeStateSnapshot | null> {
    const serialized = this.storage.getItem(this.key);
    if (!serialized) return null;

    try {
      const parsed: unknown = JSON.parse(serialized);
      return isSnapshot(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  public async save(snapshot: HorseRuntimeStateSnapshot): Promise<void> {
    this.storage.setItem(this.key, JSON.stringify(snapshot));
  }
}
