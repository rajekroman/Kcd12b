export type HorseHudGait = 'idle' | 'walk' | 'canter' | 'sprint';
export type HorseHudSolution = 'lawful_service' | 'covert_release' | null;

export interface HorseHudViewModel {
  readonly visible: boolean;
  readonly trust: {
    readonly current: number;
    readonly target: number;
    readonly label: string;
  };
  readonly solution: HorseHudSolution;
  readonly claimed: boolean;
  readonly mounted: boolean;
  readonly mountUnlocked: boolean;
  readonly gait: HorseHudGait;
  readonly stamina: number;
  readonly trial: {
    readonly active: boolean;
    readonly completed: boolean;
    readonly checkpointIndex: number;
    readonly checkpointCount: number;
    readonly label: string;
  };
  readonly failed: boolean;
  readonly statusLabel: string;
  readonly feedback: string | null;
}

export interface HorseHudPresentationInput {
  readonly trustCurrent: number;
  readonly trustTarget?: number;
  readonly solution: HorseHudSolution;
  readonly claimed: boolean;
  readonly mounted: boolean;
  readonly mountUnlocked: boolean;
  readonly gait: HorseHudGait;
  readonly stamina: number;
  readonly trialActive: boolean;
  readonly trialCompleted: boolean;
  readonly trialCheckpointIndex: number;
  readonly checkpointCount?: number;
  readonly failed: boolean;
  readonly feedback?: string | null;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const createHorseHudViewModel = ({
  trustCurrent,
  trustTarget = 3,
  solution,
  claimed,
  mounted,
  mountUnlocked,
  gait,
  stamina: rawStamina,
  trialActive,
  trialCompleted,
  trialCheckpointIndex,
  checkpointCount = 3,
  failed,
  feedback = null,
}: HorseHudPresentationInput): HorseHudViewModel => {
  const trust = clamp(trustCurrent, 0, trustTarget);
  const checkpointIndex = clamp(trialCheckpointIndex, 0, checkpointCount);
  const stamina = clamp(Math.round(rawStamina), 0, 100);
  const scopedFeedback = feedback?.trim() || null;

  const statusLabel = failed
    ? 'Jezdecký úkol selhal.'
    : trialCompleted
      ? 'Jiskra je připravena k jízdě.'
      : mounted
        ? `Jízda: ${gait}, výdrž ${stamina}.`
        : claimed
          ? 'Jiskra je získána.'
          : `Důvěra Jiskry ${trust}/${trustTarget}.`;

  return {
    visible: true,
    trust: {
      current: trust,
      target: trustTarget,
      label: `Důvěra ${trust}/${trustTarget}`,
    },
    solution,
    claimed,
    mounted,
    mountUnlocked,
    gait,
    stamina,
    trial: {
      active: trialActive,
      completed: trialCompleted,
      checkpointIndex,
      checkpointCount,
      label: trialCompleted
        ? 'Zkušební jízda dokončena'
        : `Trasa ${checkpointIndex}/${checkpointCount}`,
    },
    failed,
    statusLabel,
    feedback: scopedFeedback,
  };
};
