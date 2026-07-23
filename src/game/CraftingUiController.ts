import type Phaser from 'phaser';
import { executeCraftingCommand } from '../application/CraftingService';
import { getEconomyState, subscribeEconomy } from '../core/EconomyStore';
import {
  CRAFTING_STATIONS,
  getRecipesForStation,
  isRecipeId,
  type CraftingStation,
  type RecipeId
} from '../data/crafting';
import { ITEM_DEFINITIONS } from '../data/items';
import type { NpcId } from '../data/npcs';
import {
  getCraftingStationForNpc,
  getCraftingValidation
} from '../systems/CraftingSystem';
import { getInventoryWeight } from '../systems/InventorySystem';

export interface GameplayResumeContext {
  scene: string | undefined;
  economyOpen: boolean;
  blockingModalVisible: boolean;
}

export function shouldResumeGameplayInput(context: GameplayResumeContext): boolean {
  return context.scene === 'game' && !context.economyOpen && !context.blockingModalVisible;
}

export class CraftingUiController {
  private readonly overlay: HTMLElement;
  private readonly title: HTMLElement;
  private readonly summary: HTMLElement;
  private readonly content: HTMLElement;
  private readonly message: HTMLElement;
  private readonly closeButton: HTMLButtonElement;
  private readonly mobileButton: HTMLButtonElement | null;
  private readonly cleanup: Array<() => void> = [];
  private readonly observer: MutationObserver;
  private openState = false;
  private station: CraftingStation | null = null;

  constructor(private readonly game: Phaser.Game) {
    this.overlay = this.requireElement('#crafting-overlay');
    this.title = this.requireElement('#crafting-title');
    this.summary = this.requireElement('#crafting-summary');
    this.content = this.requireElement('#crafting-content');
    this.message = this.requireElement('#crafting-message');
    this.closeButton = this.requireElement<HTMLButtonElement>('[data-crafting-close]');
    this.mobileButton = document.querySelector<HTMLButtonElement>('[data-control="crafting"]');

    this.bind();
    this.observer = new MutationObserver(() => this.onContextChanged());
    this.observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-scene', 'data-near-npc', 'data-save-ready', 'data-economy-open']
    });
    this.cleanup.push(subscribeEconomy(() => this.render()));
    this.onContextChanged();
  }

  destroy(): void {
    this.close();
    this.observer.disconnect();
    this.cleanup.forEach((dispose) => dispose());
    this.cleanup.length = 0;
    delete document.body.dataset.craftingAvailable;
    delete document.body.dataset.craftingStation;
    delete document.body.dataset.lastCraft;
  }

  private bind(): void {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (this.openState) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (event.key === 'Escape' || event.key.toLowerCase() === 'c') this.close();
        return;
      }
      if (event.repeat || event.key.toLowerCase() !== 'c' || !this.isGameReady()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      this.open();
    };
    document.addEventListener('keydown', onKeyDown, true);
    this.cleanup.push(() => document.removeEventListener('keydown', onKeyDown, true));

    const onMobileCrafting = (event: PointerEvent): void => {
      event.preventDefault();
      event.stopPropagation();
      if (this.openState) this.close();
      else if (this.isGameReady()) this.open();
    };
    this.mobileButton?.addEventListener('pointerdown', onMobileCrafting);
    this.cleanup.push(() =>
      this.mobileButton?.removeEventListener('pointerdown', onMobileCrafting)
    );

    const onOverlayClick = (event: MouseEvent): void => {
      const target = event.target as HTMLElement;
      const button = target.closest<HTMLButtonElement>('[data-crafting-action="craft"]');
      if (!button || !isRecipeId(button.dataset.recipeId)) return;
      this.craft(button.dataset.recipeId);
    };
    this.overlay.addEventListener('click', onOverlayClick);
    this.cleanup.push(() => this.overlay.removeEventListener('click', onOverlayClick));

    const onClose = (): void => this.close();
    this.closeButton.addEventListener('click', onClose);
    this.cleanup.push(() => this.closeButton.removeEventListener('click', onClose));
  }

  private open(): void {
    if (!this.isGameReady()) return;
    const station = this.getAvailableStation();
    if (!station) {
      this.setStatus('Řemeslo je dostupné pouze u Anežky nebo Bohdana.');
      return;
    }
    if (document.body.dataset.economyOpen === 'true') {
      this.setStatus('Nejdříve zavři inventář nebo obchod.');
      return;
    }

    this.station = station;
    this.openState = true;
    this.overlay.hidden = false;
    document.body.classList.add('crafting-open');
    document.body.dataset.craftingOpen = 'true';
    document.body.dataset.craftingStation = station;
    this.pauseGameScene();
    this.setStatus(`${CRAFTING_STATIONS[station].label} je připraven.`);
    this.render();
    this.closeButton.focus();
  }

  private close(): void {
    if (!this.openState) return;
    this.openState = false;
    this.station = null;
    this.overlay.hidden = true;
    document.body.classList.remove('crafting-open');
    document.body.dataset.craftingOpen = 'false';
    delete document.body.dataset.craftingStation;
    this.resumeGameScene();
  }

  private craft(recipeId: RecipeId): void {
    if (!this.openState || !this.station) return;

    const result = executeCraftingCommand(recipeId, this.station);
    if (!result.ok) {
      this.setStatus(result.error.message);
      return;
    }

    document.body.dataset.lastCraft = recipeId;
    this.setStatus(`${result.value.recipe.name} dokončen.`);
    this.render();
  }

  private render(): void {
    const economy = getEconomyState();
    const weight = getInventoryWeight(economy.inventory);
    const station = this.station;
    if (!this.openState || !station) return;
    const stationDefinition = CRAFTING_STATIONS[station];
    const recipes = getRecipesForStation(station);

    this.title.textContent = stationDefinition.label;
    this.summary.innerHTML = `
      <span>Stanice <strong>${station === 'alchemy' ? 'Alchymie' : 'Kovárna'}</strong></span>
      <span>Batoh <strong>${weight.toFixed(1)} / ${economy.inventory.maxWeight.toFixed(1)} kg</strong></span>
      <span>${stationDefinition.description}</span>
    `;
    this.content.innerHTML = recipes.map((recipe) => {
      const validation = getCraftingValidation(economy.inventory, recipe.id);
      const ingredients = validation.ingredients.map((ingredient) => `
        <li class="crafting-ingredient${ingredient.sufficient ? '' : ' is-missing'}">
          <span>${ITEM_DEFINITIONS[ingredient.itemId].name}</span>
          <strong>${ingredient.available}/${ingredient.quantity}</strong>
        </li>
      `).join('');
      const outputs = recipe.outputs
        .map((output) => `${output.quantity}× ${ITEM_DEFINITIONS[output.itemId].name}`)
        .join(', ');
      const buttonTitle = validation.canCraft
        ? stationDefinition.actionLabel
        : validation.error?.message ?? 'Recept nelze vyrobit';

      return `
        <article class="crafting-recipe" data-recipe="${recipe.id}" data-craftable="${validation.canCraft}">
          <h3>${recipe.name}</h3>
          <p>${recipe.description}</p>
          <div class="crafting-output">Výsledek: <strong>${outputs}</strong></div>
          <ul class="crafting-ingredients">${ingredients}</ul>
          <button
            type="button"
            class="crafting-action"
            data-crafting-action="craft"
            data-recipe-id="${recipe.id}"
            title="${buttonTitle}"
            ${validation.canCraft ? '' : 'disabled'}
          >${stationDefinition.actionLabel}</button>
        </article>
      `;
    }).join('');
  }

  private onContextChanged(): void {
    const station = this.getAvailableStation();
    document.body.dataset.craftingAvailable = station ?? '';
    if (!this.isGameReady() && this.openState) this.close();
    if (this.openState && station !== this.station) this.close();
  }

  private getAvailableStation(): CraftingStation | null {
    return getCraftingStationForNpc(document.body.dataset.nearNpc as NpcId | undefined);
  }

  private pauseGameScene(): void {
    const scene = this.game.scene.getScene('GameScene');
    if (!scene?.scene.isActive()) return;
    scene.physics.world.pause();
    if (scene.input.keyboard) scene.input.keyboard.enabled = false;
  }

  private resumeGameScene(): void {
    const scene = this.game.scene.getScene('GameScene');
    if (!scene?.scene.isActive()) return;

    const blockingModalVisible = Array.from(
      document.querySelectorAll<HTMLElement>('[role="dialog"]')
    ).some((dialog) => dialog !== this.overlay && !dialog.hidden);

    if (!shouldResumeGameplayInput({
      scene: document.body.dataset.scene,
      economyOpen: document.body.dataset.economyOpen === 'true',
      blockingModalVisible
    })) return;

    scene.physics.world.resume();
    if (scene.input.keyboard) scene.input.keyboard.enabled = true;
  }

  private isGameReady(): boolean {
    return (
      document.body.dataset.scene === 'game' &&
      document.body.dataset.saveReady === 'true' &&
      document.body.dataset.economyOpen !== 'true'
    );
  }

  private setStatus(message: string): void {
    this.message.textContent = message;
    const liveStatus = document.querySelector<HTMLElement>('#game-status');
    if (liveStatus) liveStatus.textContent = message;
    document.body.dataset.craftingMessage = message;
  }

  private requireElement<T extends HTMLElement = HTMLElement>(selector: string): T {
    const element = document.querySelector<T>(selector);
    if (!element) throw new Error(`Required crafting UI element is missing: ${selector}`);
    return element;
  }
}
