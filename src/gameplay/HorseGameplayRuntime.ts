import {
  HorseRuntimeOrchestrator,
  type HorseRuntimeTransition,
} from "../application/HorseRuntimeOrchestrator";
import type {
  HorseCommandRejected,
  HorseCommandResult,
  HorseRuntimeCommand,
  HorseRuntimeEvent,
  HorseRuntimePersistenceBoundary,
  HorseRuntimeStateSnapshot,
} from "../contracts/horseRuntime";

export type HorseExternalConditions = Readonly<Record<string, boolean | number | string>>;
export type HorseExternalConditionsProvider = () => HorseExternalConditions;
export type HorseRuntimeEventListener = (event: HorseRuntimeEvent) => void;

export interface HorseGameplayRuntimeOptions {
  readonly orchestrator: HorseRuntimeOrchestrator;
  readonly persistence: HorseRuntimePersistenceBoundary;
  readonly initialState: HorseRuntimeStateSnapshot;
  readonly externalConditions?: HorseExternalConditionsProvider;
}

export type HorseGameplayDispatchResult = HorseRuntimeTransition | HorseCommandRejected;
type OrchestratorResult = HorseRuntimeTransition | HorseCommandResult<HorseRuntimeEvent>;

const isTransition = (result: OrchestratorResult): result is HorseRuntimeTransition =>
  "state" in result;

const isRejected = (result: OrchestratorResult): result is HorseCommandRejected =>
  "accepted" in result && result.accepted === false;

/**
 * Gameplay-owned adapter around the A1 orchestrator.
 *
 * It is the single mutable owner of the current horse runtime snapshot in the
 * gameplay layer. Phaser scenes and input handlers may dispatch commands and
 * subscribe to confirmed events, but they must not mutate the snapshot.
 */
export class HorseGameplayRuntime {
  private snapshot: HorseRuntimeStateSnapshot;
  private readonly listeners = new Set<HorseRuntimeEventListener>();
  private initialized = false;

  public constructor(private readonly options: HorseGameplayRuntimeOptions) {
    this.snapshot = options.initialState;
  }

  public async initialize(): Promise<HorseRuntimeStateSnapshot> {
    if (!this.initialized) {
      this.snapshot = await this.options.orchestrator.load(
        this.options.persistence,
        this.options.initialState,
      );
      this.initialized = true;
    }
    return this.snapshot;
  }

  public getSnapshot(): HorseRuntimeStateSnapshot {
    return this.snapshot;
  }

  public subscribe(listener: HorseRuntimeEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public async dispatch(command: HorseRuntimeCommand): Promise<HorseGameplayDispatchResult> {
    if (!this.initialized) {
      throw new Error("HorseGameplayRuntime must be initialized before dispatching commands.");
    }

    const result: OrchestratorResult = this.options.orchestrator.execute(
      command,
      this.snapshot,
      this.options.externalConditions?.() ?? {},
    );

    if (isRejected(result)) return result;
    if (!isTransition(result)) {
      throw new Error("Horse orchestrator accepted a command without a state transition.");
    }

    await this.options.orchestrator.save(this.options.persistence, result.state);
    this.snapshot = result.state;

    for (const event of result.events) {
      for (const listener of this.listeners) listener(event);
    }

    return result;
  }
}
