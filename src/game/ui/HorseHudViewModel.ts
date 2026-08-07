import type { HorseRuntimeStateSnapshot } from '../../contracts/horseRuntime';
import type { HorseMovementState } from '../../gameplay/HorseMovementModel';

export interface HorseHudViewModel {
  readonly visible: boolean;
  readonly trust: {
    readonly current: number;
    readonly target: number;
    readonly label: string;
  };
  readonly solution: 'lawful_service' | 'covert_release' | null;
  readonly claimed: boolean;
  readonly mounted: boolean;
  readonly mountUnlocked: boolean;
  readonly gait: HorseMovementState['gait'] | 'idle';
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
}

export interface HorseHudViewModelInput {
  readonly snapshot: HorseRuntimeStateSnapshot;
  readonly movement?: Pick<HorseMovementState, 'gait' | 'stamina'>;
  readonly actorId: string;
  readonly trustTarget?: number;
  readonly checkpointCount?: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const createHorseHudViewModel = ({
  snapshot,
  movement,
  actorId,
  trustTarget = 3,
  checkpointCount = 3,
}: HorseHudViewModelInput): HorseHudViewModel => {
  const trust = clamp(snapshot.counters['horse.jiskra.trust_points'] ?? 0, 0, trustTarget);
  const checkpointIndex = clamp(
    snapshot.counters['horse.jiskra.trial_checkpoint_index'] ?? 0,
    0,
    checkpointCount,
  );
  const claimed = Boolean(snapshot.worldFlags['horse.jiskra.claimed']);
  const mountUnlocked = Boolean(snapshot.worldFlags['horse.jiskra.mount_unlocked']);
  const trialActive = Boolean(snapshot.worldFlags['horse.jiskra.trial_started']);
  const mounted = snapshot.mountedActorId === actorId;
  const stamina = clamp(Math.round(movement?.stamina ?? 100), 0, 100);

  const statusLabel = snapshot.failed
    ? 'Jezdecký úkol selhal.'
    : snapshot.completed
      ? 'Jiskra je připravena k jízdě.'
      : mounted
        ? `Jízda: ${movement?.gait ?? 'idle'}, výdrž ${stamina}.`
        : claimed
          ? 'Jiskra je získána.'
          : `Důvěra Jiskry ${trust}/${trustTarget}.`;

  return {
    visible: !snapshot.failed || claimed || snapshot.completed,
    trust: {
      current: trust,
      target: trustTarget,
      label: `Důvěra ${trust}/${trustTarget}`,
    },
    solution: snapshot.selectedSolution,
    claimed,
    mounted,
    mountUnlocked,
    gait: movement?.gait ?? 'idle',
    stamina,
    trial: {
      active: trialActive,
      completed: snapshot.completed,
      checkpointIndex,
      checkpointCount,
      label: snapshot.completed
        ? 'Zkušební jízda dokončena'
        : `Trasa ${checkpointIndex}/${checkpointCount}`,
    },
    failed: snapshot.failed,
    statusLabel,
  };
};
