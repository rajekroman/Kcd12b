import {
  HorseCommandIds,
  type HorseCommandContext,
  type HorseFailureSource,
  type HorseRuntimeStateSnapshot,
  type HorseTrialResetReason,
} from "../contracts/horseRuntime";
import type {
  HorseQuestContentContract,
  HorseQuestSolutionId,
} from "../data/horseQuestContent";
import {
  HorseGameplayRuntime,
  type HorseGameplayDispatchResult,
} from "./HorseGameplayRuntime";

export interface HorseGameplayCoordinatorOptions {
  readonly runtime: HorseGameplayRuntime;
  readonly content: HorseQuestContentContract;
  readonly actorId: string;
  readonly nowTick: () => number;
}

export class HorseGameplayCoordinator {
  private sequence = 0;
  private commandQueue: Promise<void> = Promise.resolve();

  public constructor(private readonly options: HorseGameplayCoordinatorOptions) {}

  public initialize(): Promise<HorseRuntimeStateSnapshot> {
    return this.options.runtime.initialize();
  }

  public getSnapshot(): HorseRuntimeStateSnapshot {
    return this.options.runtime.getSnapshot();
  }

  private context(action: string): HorseCommandContext {
    const issuedAtTick = Math.max(0, Math.floor(this.options.nowTick()));
    this.sequence += 1;
    return {
      questId: this.options.content.questId,
      horseId: this.options.content.horseId,
      actorId: this.options.actorId,
      issuedAtTick,
      idempotencyKey: `${action}:${issuedAtTick}:${this.sequence}`,
    };
  }

  private enqueue(
    task: () => Promise<HorseGameplayDispatchResult>,
  ): Promise<HorseGameplayDispatchResult> {
    const run = this.commandQueue.then(task, task);
    this.commandQueue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  public selectSolution(
    solution: HorseQuestSolutionId,
  ): Promise<HorseGameplayDispatchResult> {
    return this.enqueue(() =>
      this.options.runtime.dispatch({
        id: HorseCommandIds.selectSolution,
        context: this.context(`select-${solution}`),
        solution,
      }),
    );
  }

  public performInteraction(
    interactionId: string,
  ): Promise<HorseGameplayDispatchResult> {
    const interaction = this.options.content.interactions.find(
      (candidate) => candidate.interactionId === interactionId,
    );
    if (!interaction) {
      return Promise.reject(new Error(`Unknown horse interaction: ${interactionId}`));
    }

    return this.enqueue(() =>
      this.options.runtime.dispatch({
        id: HorseCommandIds.performInteraction,
        context: this.context(interactionId),
        interactionId: interaction.interactionId,
        targetId: interaction.targetId,
        solution: interaction.solution,
        idempotency: interaction.idempotency,
      }),
    );
  }

  public toggleMount(): Promise<HorseGameplayDispatchResult> {
    return this.enqueue(() => {
      const mountedActorId = this.options.runtime.getSnapshot().mountedActorId;
      return this.options.runtime.dispatch({
        id:
          mountedActorId === this.options.actorId
            ? HorseCommandIds.dismount
            : HorseCommandIds.requestMount,
        context: this.context(
          mountedActorId === this.options.actorId ? "dismount" : "mount",
        ),
      });
    });
  }

  public confirmCheckpoint(
    checkpointId: string,
    checkpointIndex: number,
  ): Promise<HorseGameplayDispatchResult> {
    return this.enqueue(() =>
      this.options.runtime.dispatch({
        id: HorseCommandIds.confirmTrialCheckpoint,
        context: this.context(`checkpoint-${checkpointIndex}`),
        routeId: this.options.content.trialRoute.routeId,
        checkpointId,
        checkpointIndex,
      }),
    );
  }

  public resetTrial(
    reason: HorseTrialResetReason,
  ): Promise<HorseGameplayDispatchResult> {
    return this.enqueue(() =>
      this.options.runtime.dispatch({
        id: HorseCommandIds.resetTrial,
        context: this.context(`trial-reset-${reason}`),
        routeId: this.options.content.trialRoute.routeId,
        reason,
      }),
    );
  }

  public reportFailure(
    failureId: string,
    source: HorseFailureSource,
  ): Promise<HorseGameplayDispatchResult> {
    return this.enqueue(() =>
      this.options.runtime.dispatch({
        id: HorseCommandIds.reportFailure,
        context: this.context(`failure-${failureId}`),
        failureId,
        source,
      }),
    );
  }
}
