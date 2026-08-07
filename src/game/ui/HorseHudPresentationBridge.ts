import type { HorseRuntimeStateSnapshot } from '../../contracts/horseRuntime';
import { firstHorseQuestContent } from '../../data/horseQuestContent';
import { createInitialHorseRuntimeState } from '../../gameplay/HorseRuntimeState';
import { HORSE_RUNTIME_STORAGE_KEY } from '../../gameplay/HorseRuntimeStorage';
import type { HorseMovementState } from '../../gameplay/HorseMovementModel';
import { HorseHudController } from './HorseHudController';
import { createHorseHudViewModel } from './HorseHudViewModel';

const ACTOR_ID = 'player.henry';

const isHorseSnapshot = (value: unknown): value is HorseRuntimeStateSnapshot => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<HorseRuntimeStateSnapshot>;
  return (
    typeof candidate.questId === 'string' &&
    typeof candidate.horseId === 'string' &&
    !!candidate.worldFlags &&
    typeof candidate.worldFlags === 'object' &&
    !!candidate.counters &&
    typeof candidate.counters === 'object' &&
    Array.isArray(candidate.appliedIdempotencyKeys) &&
    (candidate.selectedSolution === null || typeof candidate.selectedSolution === 'string') &&
    (candidate.mountedActorId === null || typeof candidate.mountedActorId === 'string') &&
    typeof candidate.failed === 'boolean' &&
    typeof candidate.completed === 'boolean'
  );
};

const movementFromDataset = (dataset: DOMStringMap): Pick<HorseMovementState, 'gait' | 'stamina'> => {
  const gait = dataset.horseGait;
  const allowedGaits: readonly HorseMovementState['gait'][] = ['idle', 'walk', 'canter', 'sprint'];
  const stamina = Number(dataset.horseStamina ?? 100);
  return {
    gait: allowedGaits.includes(gait as HorseMovementState['gait'])
      ? (gait as HorseMovementState['gait'])
      : 'idle',
    stamina: Number.isFinite(stamina) ? stamina : 100,
  };
};

export class HorseHudPresentationBridge {
  private readonly controller: HorseHudController;
  private readonly observer: MutationObserver;
  private destroyed = false;

  public constructor(
    private readonly host: HTMLElement = document.body,
    private readonly storage: Storage = window.localStorage,
  ) {
    this.controller = new HorseHudController(host);
    this.controller.getElement().hidden = true;
    this.observer = new MutationObserver(() => this.render());
    this.observer.observe(host, {
      attributes: true,
      attributeFilter: [
        'data-horse-ready',
        'data-horse-mounted',
        'data-horse-solution',
        'data-horse-claimed',
        'data-horse-trial-active',
        'data-horse-trial-index',
        'data-horse-completed',
        'data-horse-failed',
        'data-horse-gait',
        'data-horse-stamina',
        'data-horse-action',
        'data-horse-last-event',
      ],
    });
    this.render();
  }

  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.observer.disconnect();
    this.controller.destroy();
  }

  private render(): void {
    if (this.destroyed) return;
    if (this.host.dataset.horseReady !== 'true') {
      this.controller.getElement().hidden = true;
      return;
    }

    const snapshot = this.readSnapshot();
    this.controller.render(
      createHorseHudViewModel({
        snapshot,
        movement: movementFromDataset(this.host.dataset),
        actorId: ACTOR_ID,
        trustTarget: firstHorseQuestContent.progressModels[0]?.threshold ?? 3,
        checkpointCount: firstHorseQuestContent.trialRoute.checkpointIds.length,
      }),
    );
  }

  private readSnapshot(): HorseRuntimeStateSnapshot {
    const serialized = this.storage.getItem(HORSE_RUNTIME_STORAGE_KEY);
    if (serialized) {
      try {
        const parsed: unknown = JSON.parse(serialized);
        if (isHorseSnapshot(parsed)) return parsed;
      } catch {
        // The runtime storage boundary also treats malformed data as absent.
      }
    }
    return createInitialHorseRuntimeState(firstHorseQuestContent);
  }
}
