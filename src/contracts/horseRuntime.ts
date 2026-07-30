import type {
  ContentEffect,
  HorseQuestSolutionId,
  InteractionIdempotency,
} from "../data/horseQuestContent";

export const HorseCommandIds = {
  selectSolution: "horse.command.select_solution",
  performInteraction: "horse.command.perform_interaction",
  requestMount: "horse.command.request_mount",
  dismount: "horse.command.dismount",
  confirmTrialCheckpoint: "horse.command.confirm_trial_checkpoint",
  resetTrial: "horse.command.reset_trial",
  reportFailure: "horse.command.report_failure",
} as const;

export type HorseCommandId = (typeof HorseCommandIds)[keyof typeof HorseCommandIds];

export const HorseEventIds = {
  solutionSelected: "horse.event.solution_selected",
  interactionConfirmed: "horse.event.interaction_confirmed",
  mountConfirmed: "horse.event.mount_confirmed",
  dismountConfirmed: "horse.event.dismount_confirmed",
  trialCheckpointConfirmed: "horse.event.trial_checkpoint_confirmed",
  trialResetConfirmed: "horse.event.trial_reset_confirmed",
  acquisitionConfirmed: "horse.event.acquisition_confirmed",
  questFailureConfirmed: "horse.event.quest_failure_confirmed",
  stateEffectsApplied: "horse.event.state_effects_applied",
} as const;

export type HorseEventId = (typeof HorseEventIds)[keyof typeof HorseEventIds];

export type HorseCommandRejectionCode =
  | "unknown_interaction"
  | "condition_not_met"
  | "duplicate_idempotency_key"
  | "wrong_solution"
  | "solution_already_selected"
  | "wrong_trial_checkpoint"
  | "trial_not_active"
  | "horse_not_claimed"
  | "mount_not_unlocked"
  | "horse_already_mounted"
  | "horse_not_mounted"
  | "mount_owner_mismatch"
  | "quest_failed"
  | "quest_completed"
  | "invalid_failure_source";

export interface HorseCommandContext {
  readonly questId: string;
  readonly horseId: string;
  readonly actorId: string;
  readonly issuedAtTick: number;
  readonly idempotencyKey: string;
}

export interface SelectHorseSolutionCommand {
  readonly id: typeof HorseCommandIds.selectSolution;
  readonly context: HorseCommandContext;
  readonly solution: HorseQuestSolutionId;
}

export interface PerformHorseInteractionCommand {
  readonly id: typeof HorseCommandIds.performInteraction;
  readonly context: HorseCommandContext;
  readonly interactionId: string;
  readonly targetId: string;
  readonly solution?: HorseQuestSolutionId;
  readonly idempotency: InteractionIdempotency;
}

export interface RequestMountCommand {
  readonly id: typeof HorseCommandIds.requestMount;
  readonly context: HorseCommandContext;
}

export interface DismountHorseCommand {
  readonly id: typeof HorseCommandIds.dismount;
  readonly context: HorseCommandContext;
}

export interface ConfirmTrialCheckpointCommand {
  readonly id: typeof HorseCommandIds.confirmTrialCheckpoint;
  readonly context: HorseCommandContext;
  readonly routeId: string;
  readonly checkpointId: string;
  readonly checkpointIndex: number;
}

export type HorseTrialResetReason =
  | "dismounted"
  | "route_left"
  | "wrong_checkpoint_order";

export interface ResetHorseTrialCommand {
  readonly id: typeof HorseCommandIds.resetTrial;
  readonly context: HorseCommandContext;
  readonly routeId: string;
  readonly reason: HorseTrialResetReason;
}

export type HorseFailureSource =
  | "care_mishap"
  | "stable_hazard"
  | "covert_detection";

export interface ReportHorseFailureCommand {
  readonly id: typeof HorseCommandIds.reportFailure;
  readonly context: HorseCommandContext;
  readonly failureId: string;
  readonly source: HorseFailureSource;
}

export type HorseRuntimeCommand =
  | SelectHorseSolutionCommand
  | PerformHorseInteractionCommand
  | RequestMountCommand
  | DismountHorseCommand
  | ConfirmTrialCheckpointCommand
  | ResetHorseTrialCommand
  | ReportHorseFailureCommand;

export interface HorseCommandRejected {
  readonly accepted: false;
  readonly commandId: HorseCommandId;
  readonly code: HorseCommandRejectionCode;
  readonly message: string;
}

export interface HorseCommandAccepted<TEvent extends HorseRuntimeEvent> {
  readonly accepted: true;
  readonly event: TEvent;
  readonly code?: never;
  readonly message?: never;
}

export type HorseCommandResult<TEvent extends HorseRuntimeEvent> =
  | HorseCommandAccepted<TEvent>
  | HorseCommandRejected;

export interface HorseEventContext {
  readonly questId: string;
  readonly horseId: string;
  readonly actorId: string;
  readonly confirmedAtTick: number;
  readonly idempotencyKey: string;
}

export interface HorseSolutionSelectedEvent {
  readonly id: typeof HorseEventIds.solutionSelected;
  readonly context: HorseEventContext;
  readonly solution: HorseQuestSolutionId;
  readonly appliedEffects: readonly ContentEffect[];
}

export interface HorseInteractionConfirmedEvent {
  readonly id: typeof HorseEventIds.interactionConfirmed;
  readonly context: HorseEventContext;
  readonly interactionId: string;
  readonly targetId: string;
  readonly appliedEffects: readonly ContentEffect[];
}

export interface HorseMountConfirmedEvent {
  readonly id: typeof HorseEventIds.mountConfirmed;
  readonly context: HorseEventContext;
  readonly mountedActorId: string;
}

export interface HorseDismountConfirmedEvent {
  readonly id: typeof HorseEventIds.dismountConfirmed;
  readonly context: HorseEventContext;
  readonly previousMountedActorId: string;
}

export interface HorseTrialCheckpointConfirmedEvent {
  readonly id: typeof HorseEventIds.trialCheckpointConfirmed;
  readonly context: HorseEventContext;
  readonly routeId: string;
  readonly checkpointId: string;
  readonly checkpointIndex: number;
  readonly nextCheckpointIndex: number;
}

export interface HorseTrialResetConfirmedEvent {
  readonly id: typeof HorseEventIds.trialResetConfirmed;
  readonly context: HorseEventContext;
  readonly routeId: string;
  readonly reason: HorseTrialResetReason;
  readonly nextCheckpointIndex: 0;
}

export interface HorseAcquisitionConfirmedEvent {
  readonly id: typeof HorseEventIds.acquisitionConfirmed;
  readonly context: HorseEventContext;
  readonly solution: HorseQuestSolutionId;
  readonly appliedEffects: readonly ContentEffect[];
}

export interface HorseQuestFailureConfirmedEvent {
  readonly id: typeof HorseEventIds.questFailureConfirmed;
  readonly context: HorseEventContext;
  readonly failureId: string;
  readonly source: HorseFailureSource;
  readonly terminal: true;
  readonly appliedEffects: readonly ContentEffect[];
}

export interface HorseStateEffectsAppliedEvent {
  readonly id: typeof HorseEventIds.stateEffectsApplied;
  readonly context: HorseEventContext;
  readonly sourceEventId: Exclude<HorseEventId, typeof HorseEventIds.stateEffectsApplied>;
  readonly effects: readonly ContentEffect[];
}

export type HorseRuntimeEvent =
  | HorseSolutionSelectedEvent
  | HorseInteractionConfirmedEvent
  | HorseMountConfirmedEvent
  | HorseDismountConfirmedEvent
  | HorseTrialCheckpointConfirmedEvent
  | HorseTrialResetConfirmedEvent
  | HorseAcquisitionConfirmedEvent
  | HorseQuestFailureConfirmedEvent
  | HorseStateEffectsAppliedEvent;

export interface HorseRuntimeStateSnapshot {
  readonly questId: string;
  readonly horseId: string;
  readonly worldFlags: Readonly<Record<string, boolean>>;
  readonly counters: Readonly<Record<string, number>>;
  readonly appliedIdempotencyKeys: readonly string[];
  readonly selectedSolution: HorseQuestSolutionId | null;
  readonly mountedActorId: string | null;
  readonly failed: boolean;
  readonly completed: boolean;
}

export interface HorseRuntimePersistenceBoundary {
  load(): Promise<HorseRuntimeStateSnapshot | null>;
  save(snapshot: HorseRuntimeStateSnapshot): Promise<void>;
}
