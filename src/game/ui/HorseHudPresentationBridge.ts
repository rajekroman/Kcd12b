import { firstHorseQuestContent } from '../../data/horseQuestContent';
import { HorseHudController } from './HorseHudController';
import {
  createHorseHudViewModel,
  type HorseHudGait,
  type HorseHudSolution,
} from './HorseHudViewModel';

const ACTOR_ID = 'player.henry';
const ALLOWED_GAITS: readonly HorseHudGait[] = ['idle', 'walk', 'canter', 'sprint'];

const readBoolean = (value: string | undefined): boolean => value === 'true';

const readNumber = (value: string | undefined, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const readGait = (value: string | undefined): HorseHudGait =>
  ALLOWED_GAITS.includes(value as HorseHudGait) ? (value as HorseHudGait) : 'idle';

const readSolution = (value: string | undefined): HorseHudSolution =>
  value === 'lawful_service' || value === 'covert_release' ? value : null;

export class HorseHudPresentationBridge {
  private readonly controller: HorseHudController;
  private readonly observer: MutationObserver;
  private destroyed = false;

  public constructor(private readonly host: HTMLElement = document.body) {
    this.controller = new HorseHudController(host);
    this.controller.getElement().hidden = true;
    this.observer = new MutationObserver(() => this.render());
    this.observer.observe(host, {
      attributes: true,
      attributeFilter: [
        'data-horse-ready',
        'data-horse-trust',
        'data-horse-mounted',
        'data-horse-solution',
        'data-horse-claimed',
        'data-horse-mount-unlocked',
        'data-horse-trial-active',
        'data-horse-trial-index',
        'data-horse-completed',
        'data-horse-failed',
        'data-horse-gait',
        'data-horse-stamina',
        'data-horse-action',
        'data-horse-last-event',
        'data-horse-feedback',
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

    const dataset = this.host.dataset;
    this.controller.render(
      createHorseHudViewModel({
        trustCurrent: readNumber(dataset.horseTrust),
        trustTarget: firstHorseQuestContent.progressModels[0]?.threshold ?? 3,
        solution: readSolution(dataset.horseSolution),
        claimed: readBoolean(dataset.horseClaimed),
        mounted: dataset.horseMounted === ACTOR_ID,
        mountUnlocked: readBoolean(dataset.horseMountUnlocked),
        gait: readGait(dataset.horseGait),
        stamina: readNumber(dataset.horseStamina, 100),
        trialActive: readBoolean(dataset.horseTrialActive),
        trialCompleted: readBoolean(dataset.horseCompleted),
        trialCheckpointIndex: readNumber(dataset.horseTrialIndex),
        checkpointCount: firstHorseQuestContent.trialRoute.checkpointIds.length,
        failed: readBoolean(dataset.horseFailed),
      }),
    );
  }
}
