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
  type HorseQuestFailureConfirmedEvent,
  type HorseRuntimeCommand,
  type HorseRuntimeEvent,
  type HorseRuntimeStateSnapshot,
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

    if (effect.kind === "set_flag" && effect.target === "horse.jiskra.trial_completed" && effect.value === true) {
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

export class HorseRuntimeOrchestrator {
  public constructor(private readonly content: HorseQuestContentContract) {}

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
          ...next,
          appliedIdempotencyKeys: [...next.appliedIdempotencyKeys, command.context.idempotencyKey],
          selectedSolution: command.solution ?? next.selectedSolution,
        },
        events: [confirmed, {
          id: HorseEventIds.stateEffectsApplied,
          context: confirmed.context,
          sourceEventId: confirmed.id,
          effects: interaction.effects,
        }],
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
      if (!conditionsMatch(failure.activeWhen, state, external) || conditionsMatch(failure.ignoredWhen, state, external)) {
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
        state: {
          ...state,
          failed: true,
          appliedIdempotencyKeys: [...state.appliedIdempotencyKeys, command.context.idempotencyKey],
        },
        events: [confirmed],
      };
    }

    return reject(command, "condition_not_met", "Command is declared but not implemented in the architecture slice yet.");
  }
}
