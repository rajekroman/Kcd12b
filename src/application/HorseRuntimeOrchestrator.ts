import type {
  ContentConditionSet,
  ContentEffect,
  HorseQuestContentContract,
  HorseQuestInteraction,
  HorseQuestSolutionId,
} from "../data/horseQuestContent";
import {
  HorseCommandIds,
  HorseEventIds,
  type HorseAcquisitionConfirmedEvent,
  type HorseCommandRejected,
  type HorseCommandResult,
  type HorseDismountConfirmedEvent,
  type HorseEventContext,
  type HorseFailureSource,
  type HorseInteractionConfirmedEvent,
  type HorseMountConfirmedEvent,
  type HorseQuestFailureConfirmedEvent,
  type HorseRuntimeCommand,
  type HorseRuntimeEvent,
  type HorseRuntimePersistenceBoundary,
  type HorseRuntimeStateSnapshot,
  type HorseSolutionSelectedEvent,
  type HorseStateEffectsAppliedEvent,
  type HorseTrialCheckpointConfirmedEvent,
  type HorseTrialResetConfirmedEvent,
  type HorseTrialResetReason,
} from "../contracts/horseRuntime";

export interface HorseRuntimeTransition {
  readonly state: HorseRuntimeStateSnapshot;
  readonly events: readonly HorseRuntimeEvent[];
}

const reject = (
  command: HorseRuntimeCommand,
  code: HorseCommandRejected["code"],
  message: string,
): HorseCommandRejected => ({ accepted: false, commandId: command.id, code, message });

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

const effectsEvent = (
  context: HorseEventContext,
  sourceEventId: HorseStateEffectsAppliedEvent["sourceEventId"],
  effects: readonly ContentEffect[],
): HorseStateEffectsAppliedEvent => ({
  id: HorseEventIds.stateEffectsApplied,
  context,
  sourceEventId,
  effects,
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

  private applyProgressCompletion(
    previous: HorseRuntimeStateSnapshot,
    next: HorseRuntimeStateSnapshot,
  ): { state: HorseRuntimeStateSnapshot; effects: readonly ContentEffect[] } {
    const completionEffects: ContentEffect[] = [];
    let state = next;
    for (const model of this.content.progressModels) {
      const before = previous.counters[model.counterId] ?? model.initialValue;
      const after = state.counters[model.counterId] ?? model.initialValue;
      if (before < model.threshold && after >= model.threshold) {
        completionEffects.push(...model.completionEffects);
        state = applyEffects(state, model.completionEffects);
      }
    }
    return { state, effects: completionEffects };
  }

  private resetTrial(
    command: HorseRuntimeCommand,
    state: HorseRuntimeStateSnapshot,
    reason: HorseTrialResetReason,
  ): HorseRuntimeTransition {
    const effects: readonly ContentEffect[] = [
      { kind: "set_flag", target: "horse.jiskra.trial_started", value: false },
      { kind: "set_counter", target: this.content.trialRoute.progressCounterId, value: 0 },
    ];
    const confirmed: HorseTrialResetConfirmedEvent = {
      id: HorseEventIds.trialResetConfirmed,
      context: eventContext(command),
      routeId: this.content.trialRoute.routeId,
      reason,
      nextCheckpointIndex: 0,
    };
    const next = withIdempotencyKey(applyEffects(state, effects), command.context.idempotencyKey);
    return { state: next, events: [confirmed, effectsEvent(confirmed.context, confirmed.id, effects)] };
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

    if (command.id === HorseCommandIds.selectSolution) {
      if (state.selectedSolution) {
        return reject(command, "solution_already_selected", "Horse acquisition solution is already selected.");
      }
      const choice = this.content.dialogues
        .flatMap((dialogue) => dialogue.choices)
        .find((candidate) => candidate.id === `choice.${command.solution}`);
      if (!choice || (choice.requires && !conditionsMatch(choice.requires, state, external))) {
        return reject(command, "condition_not_met", "Solution choice preconditions are not satisfied.");
      }
      const stageEffects = this.content.stages.find((stage) => stage.id === "solution_selected")?.onComplete ?? [];
      const effects = [...choice.effects, ...stageEffects];
      const confirmed: HorseSolutionSelectedEvent = {
        id: HorseEventIds.solutionSelected,
        context: eventContext(command),
        solution: command.solution,
        appliedEffects: effects,
      };
      const next = withIdempotencyKey(
        { ...applyEffects(state, effects), selectedSolution: command.solution },
        command.context.idempotencyKey,
      );
      return { state: next, events: [confirmed, effectsEvent(confirmed.context, confirmed.id, effects)] };
    }

    if (command.id === HorseCommandIds.performInteraction) {
      const interaction = findInteraction(this.content, command.interactionId);
      if (!interaction || interaction.targetId !== command.targetId) {
        return reject(command, "unknown_interaction", "Interaction is not declared by the horse content contract.");
      }
      if (
        interaction.solution &&
        (state.selectedSolution !== interaction.solution ||
          (command.solution !== undefined && command.solution !== interaction.solution))
      ) {
        return reject(command, "wrong_solution", "Interaction does not belong to the selected solution.");
      }
      if (
        interaction.interactionId === this.content.trialRoute.startInteractionId &&
        state.mountedActorId !== command.context.actorId
      ) {
        return reject(command, "horse_not_mounted", "Trial can start only for the authoritative mounted actor.");
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
      const interactionState = applyEffects(state, interaction.effects);
      const progress = this.applyProgressCompletion(state, interactionState);
      const allEffects = [...interaction.effects, ...progress.effects];
      const next = withIdempotencyKey(progress.state, command.context.idempotencyKey);
      const events: HorseRuntimeEvent[] = [
        confirmed,
        effectsEvent(confirmed.context, confirmed.id, allEffects),
      ];
      const claimedNow = !state.worldFlags["horse.jiskra.claimed"] && next.worldFlags["horse.jiskra.claimed"];
      if (claimedNow && state.selectedSolution) {
        const acquired: HorseAcquisitionConfirmedEvent = {
          id: HorseEventIds.acquisitionConfirmed,
          context: confirmed.context,
          solution: state.selectedSolution,
          appliedEffects: interaction.effects,
        };
        events.splice(1, 0, acquired);
      }
      return { state: next, events };
    }

    if (command.id === HorseCommandIds.requestMount) {
      if (!state.worldFlags["horse.jiskra.claimed"]) {
        return reject(command, "horse_not_claimed", "Horse must be claimed before mount can be requested.");
      }
      if (!state.worldFlags["horse.jiskra.mount_unlocked"]) {
        return reject(command, "mount_not_unlocked", "Mount interaction is not unlocked.");
      }
      if (state.mountedActorId) {
        return reject(command, "horse_already_mounted", "Horse already has an authoritative mount owner.");
      }
      const confirmed: HorseMountConfirmedEvent = {
        id: HorseEventIds.mountConfirmed,
        context: eventContext(command),
        mountedActorId: command.context.actorId,
      };
      return {
        state: withIdempotencyKey(
          { ...state, mountedActorId: command.context.actorId },
          command.context.idempotencyKey,
        ),
        events: [confirmed],
      };
    }

    if (command.id === HorseCommandIds.dismount) {
      if (!state.mountedActorId) {
        return reject(command, "horse_not_mounted", "Horse has no active mount owner.");
      }
      if (state.mountedActorId !== command.context.actorId) {
        return reject(command, "mount_owner_mismatch", "Only the authoritative mount owner may dismount.");
      }
      const confirmed: HorseDismountConfirmedEvent = {
        id: HorseEventIds.dismountConfirmed,
        context: eventContext(command),
        previousMountedActorId: state.mountedActorId,
      };
      const unmounted = { ...state, mountedActorId: null };
      if (state.worldFlags["horse.jiskra.trial_started"]) {
        const reset = this.resetTrial(command, unmounted, "dismounted");
        return { state: reset.state, events: [confirmed, ...reset.events] };
      }
      return {
        state: withIdempotencyKey(unmounted, command.context.idempotencyKey),
        events: [confirmed],
      };
    }

    if (command.id === HorseCommandIds.confirmTrialCheckpoint) {
      const route = this.content.trialRoute;
      if (!state.worldFlags["horse.jiskra.trial_started"]) {
        return reject(command, "trial_not_active", "Trial checkpoint requires an active trial lifecycle.");
      }
      if (command.routeId !== route.routeId) {
        return reject(command, "wrong_trial_checkpoint", "Trial route is not declared by the horse contract.");
      }
      const expectedIndex = state.counters[route.progressCounterId] ?? 0;
      const expectedCheckpointId = route.checkpointIds[expectedIndex];
      if (command.checkpointIndex !== expectedIndex || command.checkpointId !== expectedCheckpointId) {
        return this.resetTrial(command, state, "wrong_checkpoint_order");
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
            counters: { ...state.counters, [route.progressCounterId]: nextCheckpointIndex },
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
      return this.resetTrial(command, state, command.reason);
    }

    if (command.id === HorseCommandIds.reportFailure) {
      const failure = this.content.failures.find((candidate) => candidate.id === command.failureId);
      const contentEvent = failure
        ? this.content.events.find((event) => event.eventId === failure.confirmedEventId)
        : undefined;
      const payloadSources = contentEvent?.payload.find((field) => field.name === "source")?.allowedValues;
      const sourceAllowed =
        command.source === "covert_detection"
          ? failure?.id === "failure.first_horse.covert_detection"
          : payloadSources?.includes(command.source) === true;
      if (!failure || !contentEvent || !sourceAllowed) {
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
        appliedEffects: contentEvent.effects,
      };
      const next = withIdempotencyKey(
        { ...applyEffects(state, contentEvent.effects), failed: true, mountedActorId: null },
        command.context.idempotencyKey,
      );
      return {
        state: next,
        events: [confirmed, effectsEvent(confirmed.context, confirmed.id, contentEvent.effects)],
      };
    }

    return reject(command, "condition_not_met", "Command is not supported by the horse orchestrator.");
  }
}
