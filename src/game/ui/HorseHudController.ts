import '../../styles/horse-hud.css';
import type { HorseHudViewModel } from './HorseHudViewModel';

export class HorseHudController {
  private readonly root: HTMLElement;

  public constructor(host: HTMLElement = document.body) {
    const root = document.createElement('section');
    root.id = 'horse-hud';
    root.className = 'horse-hud';
    root.setAttribute('aria-label', 'Stav koně');
    root.setAttribute('aria-live', 'polite');
    root.dataset.horseHud = 'true';
    root.innerHTML = `
      <div class="horse-hud__row horse-hud__summary">
        <strong data-horse-hud-name>Jiskra</strong>
        <span data-horse-hud-status></span>
      </div>
      <div class="horse-hud__row">
        <span data-horse-hud-trust></span>
        <span data-horse-hud-mount></span>
      </div>
      <div class="horse-hud__row" data-horse-hud-ride>
        <span data-horse-hud-gait></span>
        <span data-horse-hud-stamina></span>
        <span data-horse-hud-trial></span>
      </div>
    `;
    host.append(root);
    this.root = root;
  }

  public render(viewModel: HorseHudViewModel): void {
    this.root.hidden = !viewModel.visible;
    this.root.dataset.claimed = String(viewModel.claimed);
    this.root.dataset.mounted = String(viewModel.mounted);
    this.root.dataset.mountUnlocked = String(viewModel.mountUnlocked);
    this.root.dataset.failed = String(viewModel.failed);
    this.root.dataset.trialActive = String(viewModel.trial.active);
    this.root.dataset.trialIndex = String(viewModel.trial.checkpointIndex);
    this.root.dataset.gait = viewModel.gait;
    this.root.dataset.stamina = String(viewModel.stamina);

    this.text('[data-horse-hud-status]', viewModel.statusLabel);
    this.text('[data-horse-hud-trust]', viewModel.trust.label);
    this.text(
      '[data-horse-hud-mount]',
      viewModel.mounted
        ? 'Nasednuto'
        : viewModel.mountUnlocked
          ? 'Nasednutí dostupné'
          : viewModel.claimed
            ? 'Nasednutí zamčeno'
            : 'Kůň nezískán',
    );
    this.text('[data-horse-hud-gait]', `Chod: ${viewModel.gait}`);
    this.text('[data-horse-hud-stamina]', `Výdrž: ${viewModel.stamina}`);
    this.text('[data-horse-hud-trial]', viewModel.trial.label);

    const ride = this.root.querySelector<HTMLElement>('[data-horse-hud-ride]');
    if (ride) ride.hidden = !viewModel.mounted && !viewModel.trial.active;
  }

  public destroy(): void {
    this.root.remove();
  }

  public getElement(): HTMLElement {
    return this.root;
  }

  private text(selector: string, value: string): void {
    const element = this.root.querySelector<HTMLElement>(selector);
    if (element) element.textContent = value;
  }
}
