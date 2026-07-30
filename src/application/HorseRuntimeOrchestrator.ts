import type {
  ContentConditionSet,
  ContentEffect,
  HorseQuestContentContract,
  HorseQuestInteraction,
} from "../data/horseQuestContent";
import {
  HorseCommandIds,
  HorseEventIds,
  type HorseCommandRejected,
  type HorseCommandResult,
  type HorseEventContext,
  type HorseFailureSource,
  type HorseInteractionConfirmedEvent,
  type HorseMountConfirmedEvent,
  type HorseQuestFailureConfirmedEvent,
  type HorseRuntimeCommand,
  type HorseRuntimeEvent,
  type HorseRuntimePersistenceBoundary,
  type HorseRuntimeStateSnapshot,
  type HorseTrialCheckpointConfirmedEvent,
  type HorseTrialResetConfirmedEvent,
} from "../contracts/horseRuntime";

export interface HorseRuntimeTransition {
  readonly state: HorseRuntimeStateSnapshot;
  readonly events: readonly HorseRuntimeEvent[];
}

const reject = (
  command: HorseRuntimeCommand,
  code: HorseCommandRejected["code"],
  message: string,
): HorseCommandRejected => ({
  accepted: false,
  commandId: command.id,
  code,
  message,
});

const eventContext = (command: HorseRuntimeCommand): HorseEventContext => ({
  questId: command.context.questId,
  horseId: command.context.horseId,
  actorId: command.context.actorId,
  confirmedAtTick: command.context.issuedAtTick,
  idempotencyKey: command.context.idempotencyKey,
});

const conditionMatches = (
  condition: ContentConditionSet["conditions"][number],
  state: HorseRuntimeStateSnapshot,
  external: Readonly<Record<string, boolean | number | string>>,
): boolean => {
  const actual =
    condition.source === "world_flag"
      ? state.worldFlags[condition.target]
      : condition.source === "counter"
        ? state.counters[condition.target]
        : external[condition.target];

  if (condition.operator === "equals") return actual === condition.value;
  if (condition.operator === "not_equals") return actual !== condition.value;
  return typeof actual === "number" && typeof condition.value === "number" && actual >= condition.value;
};

const conditionsMatch = (
  set: ContentConditionSet,
  state: HorseRuntimeStateSnapshot,
  external: Readonly<Record<string, boolean | number | string>>,
): boolean => {
  const matches = set.conditions.map((condition) => conditionMatches(condition, state, external));
  return set.mode === "all" ? matches.every(Boolean) : matches.some(Boolean);
};

const applyEffects = (
  state: HorseRuntimeStateSnapshot,
  effects: readonly ContentEffect[],
): HorseRuntimeStateSnapshot => {
  const worldFlags = { ...state.worldFlags };
  const counters = { ...state.counters };
  let failed = state.failed;
  let completed = state.completed;

  for (const effect of effects) {
    if (effect.kind === "set_flag" && typeof effect.value === "boolean") {
      worldFlags[effect.target] = effect.value;
    } else if (effect.kind === "set_counter" && typeof effect.value === "number") {
      counters[effect.target] = effect.value;
    } else if (effect.kind === "increment_counter" && typeof effect.value === "number") {
      counters[effect.target] = (counters[effect.target] ?? 0) + effect.value;
    } else if (effect.kind === "fail_quest") {
      failed = true;
    }

    if (
      effect.kind === "set_flag" &&
      effect.target === "horse.jiskra.trial_completed" &&
      effect.value === true
    ) {
      completed = true;
    }
  }

  return { ...state, worldFlags, counters, failed, completed };
};

const findInteraction = (
  content: HorseQuestContentContract,
  interactionId: string,
): HorseQuestInteraction | undefined =>
  content.interactions.find((interaction) => interaction.interactionId === interactionId);

const withIdempotencyKey = (
  state: HorseRuntimeStateSnapshot,
  key: string,
): HorseRuntimeStateSnapshot => ({
  ...state,
  appliedIdempotencyKeys: [...state.appliedIdempotencyKeys, key],
});

export class HorseRuntimeOrchestrator {
  public constructor(private readonly content: HorseQuestContentContract) {}

  public async load(
    boundary: HorseRuntimePersistenceBoundary,
    fallback: HorseRuntimeStateSnapshot,
  ): Promise<HorseRuntimeStateSnapshot> {
    return (await boundary.load()) ?? fallback;
  }

  public async save(
    boundary: HorseRuntimePersistenceBoundary,
    snapshot: HorseRuntimeStateSnapshot,
  ): Promise<void> {
    await boundary.save(snapshot);
  }

  public execute(
    command: HorseRuntimeCommand,
    state: HorseRuntimeStateSnapshot,
    external: Readonly<Record<string, boolean | number | string>> = {},
  ): HorseCommandResult<HorseRuntimeEvent> | HorseRuntimeTransition {
    if (state.appliedIdempotencyKeys.includes(command.context.idempotencyKey)) {
      return reject(command, "duplicate_idempotency_key", "Command idempotency key was already applied.");
    }
    if (state.failed) return reject(command, "quest_failed", "Horse quest is already failed.");
    if (state.completed && command.id === HorseCommandIds.reportFailure) {
      return reject(command, "quest_completed", "Completed horse quest cannot be failed retroactively.");
    }

    if (command.id === HorseCommandIds.performInteraction) {
      const interaction = findInteraction(this.content, command.interactionId);
      if (!interaction || interaction.targetId !== command.targetId) {
        return reject(command, "unknown_interaction", "Interaction is not declared by the horse content contract.");
      }
      if (interaction.solution && command.solution !== interaction.solution) {
        return reject(command, "wrong_solution", "Interaction does not belong to the selected solution.");
      }
      if (!conditionsMatch(interaction.requires, state, external)) {
        return reject(command, "condition_not_met", "Interaction preconditions are not satisfied.");
      }

      const confirmed: HorseInteractionConfirmedEvent = {
        id: HorseEventIds.interactionConfirmed,
        context: eventContext(command),
        interactionId: interaction.interactionId,
        targetId: interaction.targetId,
        appliedEffects: interaction.effects,
      };
      const next = applyEffects(state, interaction.effects);
      return {
        state: {
          ...withIdempotencyKey(next, command.context.idempotencyKey),
          selectedSolution: command.solution ?? next.selectedSolution,
        },
        events: [
          confirmed,
          {
            id: HorseEventIds.stateEffectsApplied,
            context: confirmed.context,
            sourceEventId: confirmed.id,
            effects: interaction.effects,
          },
        ],
      };
    }

    if (command.id === HorseCommandIds.requestMount) {
      if (!state.worldFlags["horse.jiskra.claimed"]) {
        return reject(command, "horse_not_claimed", "Horse must be claimed before mount can be requested.");
      }
      if (!state.worldFlags["horse.jiskra.mount_unlocked"]) {
        return reject(command, "mount_not_unlocked", "Mount interaction is not unlocked.");
      }

      const confirmed: HorseMountConfirmedEvent = {
        id: HorseEventIds.mountConfirmed,
        context: eventContext(command),
      };
      return {
        state: withIdempotencyKey(state, command.context.idempotencyKey),
        events: [confirmed],
      };
    }

    if (command.id === HorseCommandIds.confirmTrialCheckpoint) {
      const route = this.content.trialRoute;
      if (command.routeId !== route.routeId) {
        return reject(command, "wrong_trial_checkpoint", "Trial route is not declared by the horse contract.");
      }
      const expectedIndex = state.counters[route.progressCounterId] ?? 0;
      const expectedCheckpointId = route.checkpointIds[expectedIndex];
      if (
        command.checkpointIndex !== expectedIndex ||
        command.checkpointId !== expectedCheckpointId
      ) {
        return reject(command, "wrong_trial_checkpoint", "Trial checkpoint is out of order.");
      }

      const nextCheckpointIndex = expectedIndex + 1;
      const confirmed: HorseTrialCheckpointConfirmedEvent = {
        id: HorseEventIds.trialCheckpointConfirmed,
        context: eventContext(command),
        routeId: command.routeId,
        checkpointId: command.checkpointId,
        checkpointIndex: command.checkpointIndex,
        nextCheckpointIndex,
      };
      return {
        state: withIdempotencyKey(
          {
            ...state,
            counters: {
              ...state.counters,
              [route.progressCounterId]: nextCheckpointIndex,
            },
          },
          command.context.idempotencyKey,
        ),
        events: [confirmed],
      };
    }

    if (command.id === HorseCommandIds.resetTrial) {
      if (command.routeId !== this.content.trialRoute.routeId) {
        return reject(command, "wrong_trial_checkpoint", "Trial route is not declared by the horse contract.");
      }
      const confirmed: HorseTrialResetConfirmedEvent = {
        id: HorseEventIds.trialResetConfirmed,
        context: eventContext(command),
        routeId: command.routeId,
        reason: command.reason,
        nextCheckpointIndex: 0,
      };
      return {
        state: withIdempotencyKey(
          {
            ...state,
            counters: {
              ...state.counters,
              [this.content.trialRoute.progressCounterId]: 0,
            },
          },
          command.context.idempotencyKey,
        ),
        events: [confirmed],
      };
    }

    if (command.id === HorseCommandIds.reportFailure) {
      const failure = this.content.failures.find((candidate) => candidate.id === command.failureId);
      const sourceAllowed = failure
        ? this.content.events
            .find((event) => event.eventId === failure.confirmedEventId)
            ?.payload.find((field) => field.name === "source")
            ?.allowedValues?.includes(command.source)
        : false;
      if (!failure || !sourceAllowed) {
        return reject(command, "invalid_failure_source", "Failure source is not declared by the content contract.");
      }
      if (
        !conditionsMatch(failure.activeWhen, state, external) ||
        conditionsMatch(failure.ignoredWhen, state, external)
      ) {
        return reject(command, "condition_not_met", "Failure is not active in the current state.");
      }

      const confirmed: HorseQuestFailureConfirmedEvent = {
        id: HorseEventIds.questFailureConfirmed,
        context: eventContext(command),
        failureId: failure.id,
        source: command.source as HorseFailureSource,
        terminal: true,
      };
      return {
        state: withIdempotencyKey(
          {
            ...state,
            failed: true,
          },
          command.context.idempotencyKey,
        ),
        events: [confirmed],
      };
    }

    return reject(command, "condition_not_met", "Command is not supported by the horse orchestrator.");
  }
}
