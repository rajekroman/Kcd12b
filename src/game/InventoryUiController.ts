import type Phaser from 'phaser';
import { EventBus, GameEvents } from '../core/EventBus';
import {
  getEconomyState,
  setEconomyState,
  subscribeEconomy
} from '../core/EconomyStore';
import {
  ITEM_DEFINITIONS,
  type EquipmentSlot,
  type ItemId
} from '../data/items';
import {
  buyItem,
  equipItem,
  getEquipmentStats,
  getInventoryWeight,
  sellItem,
  unequipSlot,
  useConsumable,
  type EconomyState,
  type InventoryStack
} from '../systems/InventorySystem';

const SLOT_LABELS: Record<EquipmentSlot, string> = {
  weapon: 'Zbraň',
  armor: 'Zbroj',
  accessory: 'Doplněk'
};

type EconomyMode = 'inventory' | 'trade';

export class InventoryUiController {
  private readonly overlay: HTMLElement;
  private readonly content: HTMLElement;
  private readonly summary: HTMLElement;
  private readonly message: HTMLElement;
  private readonly inventoryTab: HTMLButtonElement;
  private readonly tradeTab: HTMLButtonElement;
  private readonly closeButton: HTMLButtonElement;
  private readonly mobileButton: HTMLButtonElement | null;
  private readonly cleanup: Array<() => void> = [];
  private readonly observer: MutationObserver;
  private mode: EconomyMode = 'inventory';
  private openState = false;

  constructor(private readonly game: Phaser.Game) {
    this.overlay = this.requireElement('#economy-overlay');
    this.content = this.requireElement('#economy-content');
    this.summary = this.requireElement('#economy-summary');
    this.message = this.requireElement('#economy-message');
    this.inventoryTab = this.requireElement<HTMLButtonElement>('[data-economy-tab="inventory"]');
    this.tradeTab = this.requireElement<HTMLButtonElement>('[data-economy-tab="trade"]');
    this.closeButton = this.requireElement<HTMLButtonElement>('[data-economy-close]');
    this.mobileButton = document.querySelector<HTMLButtonElement>('[data-control="inventory"]');

    this.bind();
    this.observer = new MutationObserver(() => this.onContextChanged());
    this.observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-scene', 'data-near-npc', 'data-save-ready']
    });
    this.cleanup.push(subscribeEconomy(() => this.render()));
    this.render();
  }

  destroy(): void {
    this.close();
    this.observer.disconnect();
    this.cleanup.forEach((dispose) => dispose());
    this.cleanup.length = 0;
  }

  private bind(): void {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.key === 'Escape' && this.openState) {
        event.preventDefault();
        this.close();
        return;
      }
      if (event.key.toLowerCase() === 'i' && this.isGameReady()) {
        event.preventDefault();
        this.toggle();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    this.cleanup.push(() => document.removeEventListener('keydown', onKeyDown));

    const onMobileInventory = (event: PointerEvent) => {
      event.preventDefault();
      if (this.isGameReady()) this.toggle();
    };
    this.mobileButton?.addEventListener('pointerdown', onMobileInventory);
    this.cleanup.push(() => this.mobileButton?.removeEventListener('pointerdown', onMobileInventory));

    const onOverlayClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const actionButton = target.closest<HTMLButtonElement>('[data-economy-action]');
      if (actionButton) {
        this.handleAction(actionButton);
        return;
      }
      const tab = target.closest<HTMLButtonElement>('[data-economy-tab]');
      if (tab?.dataset.economyTab === 'inventory') this.setMode('inventory');
      if (tab?.dataset.economyTab === 'trade') this.setMode('trade');
    };
    this.overlay.addEventListener('click', onOverlayClick);
    this.cleanup.push(() => this.overlay.removeEventListener('click', onOverlayClick));

    const onClose = () => this.close();
    this.closeButton.addEventListener('click', onClose);
    this.cleanup.push(() => this.closeButton.removeEventListener('click', onClose));
  }

  private toggle(): void {
    if (this.openState) this.close();
    else this.open();
  }

  private open(): void {
    if (!this.isGameReady()) return;
    this.openState = true;
    this.mode = this.canTrade() ? 'trade' : 'inventory';
    this.overlay.hidden = false;
    document.body.classList.add('economy-open');
    document.body.dataset.economyOpen = 'true';
    this.pauseGameScene();
    this.setStatus(this.canTrade() ? 'Kateřina rozložila své zboží.' : 'Inventář otevřen.');
    this.render();
    this.closeButton.focus();
  }

  private close(): void {
    if (!this.openState) return;
    this.openState = false;
    this.overlay.hidden = true;
    document.body.classList.remove('economy-open');
    document.body.dataset.economyOpen = 'false';
    delete document.body.dataset.economyMode;
    this.resumeGameScene();
  }

  private setMode(mode: EconomyMode): void {
    if (mode === 'trade' && !this.canTrade()) {
      this.setStatus('Obchod je dostupný pouze u kupkyně Kateřiny.');
      return;
    }
    this.mode = mode;
    this.setStatus(mode === 'trade' ? 'Obchod s Kateřinou.' : 'Vybavení a zásoby.');
    this.render();
  }

  private render(): void {
    const economy = getEconomyState();
    const { inventory } = economy;
    const weight = getInventoryWeight(inventory);
    const stats = getEquipmentStats(inventory);
    const canTrade = this.canTrade();

    document.body.dataset.groschen = String(inventory.groschen);
    document.body.dataset.equippedWeapon = inventory.equipment.weapon ?? '';
    document.body.dataset.inventoryWeight = weight.toFixed(2);
    if (!this.openState) return;

    if (this.mode === 'trade' && !canTrade) this.mode = 'inventory';
    document.body.dataset.economyMode = this.mode;

    this.inventoryTab.classList.toggle('is-active', this.mode === 'inventory');
    this.tradeTab.classList.toggle('is-active', this.mode === 'trade');
    this.tradeTab.disabled = !canTrade;
    this.tradeTab.title = canTrade ? 'Obchodovat s Kateřinou' : 'Přistup blíž ke Kateřině';

    this.summary.innerHTML = `
      <span><strong>${inventory.groschen}</strong> grošů</span>
      <span><strong>${weight.toFixed(1)}</strong> / ${inventory.maxWeight.toFixed(1)} kg</span>
      <span>Útok <strong>+${stats.attack}</strong></span>
      <span>Zbroj <strong>+${stats.armor}</strong></span>
      <span>Charisma <strong>+${stats.charisma}</strong></span>
    `;

    this.content.innerHTML = this.mode === 'trade'
      ? this.renderTrade(economy)
      : this.renderInventory(economy);
  }

  private renderInventory(economy: EconomyState): string {
    const { inventory } = economy;
    const equipment = (Object.keys(SLOT_LABELS) as EquipmentSlot[])
      .map((slot) => {
        const itemId = inventory.equipment[slot];
        const itemName = itemId ? ITEM_DEFINITIONS[itemId].name : 'Prázdné';
        const action = itemId
          ? `<button data-economy-action="unequip" data-slot="${slot}">Sundat</button>`
          : '';
        return `<div class="equipment-slot"><span>${SLOT_LABELS[slot]}</span><strong>${itemName}</strong>${action}</div>`;
      })
      .join('');

    return `
      <section class="economy-section">
        <h3>Vybavení</h3>
        <div class="equipment-grid">${equipment}</div>
      </section>
      <section class="economy-section">
        <h3>Batoh</h3>
        <div class="item-list">${this.renderStacks(inventory.items, 'inventory')}</div>
      </section>
    `;
  }

  private renderTrade(economy: EconomyState): string {
    return `
      <div class="trade-columns">
        <section class="economy-section">
          <h3>Kateřina · ${economy.merchant.groschen} grošů</h3>
          <div class="item-list">${this.renderStacks(economy.merchant.stock, 'buy')}</div>
        </section>
        <section class="economy-section">
          <h3>Prodat z batohu</h3>
          <div class="item-list">${this.renderStacks(economy.inventory.items, 'sell')}</div>
        </section>
      </div>
    `;
  }

  private renderStacks(
    stacks: readonly InventoryStack[],
    context: 'inventory' | 'buy' | 'sell'
  ): string {
    if (stacks.length === 0) return '<p class="empty-state">Nic zde není.</p>';

    return stacks
      .map((stack) => {
        const item = ITEM_DEFINITIONS[stack.itemId];
        const price = context === 'buy' ? item.buyPrice : item.sellPrice;
        const equipped = Object.values(getEconomyState().inventory.equipment).includes(stack.itemId);
        const actions: string[] = [];

        if (context === 'inventory' && item.equipmentSlot) {
          actions.push(
            `<button data-economy-action="equip" data-item-id="${item.id}">${equipped ? 'Vybaveno' : 'Vybavit'}</button>`
          );
        }
        if (context === 'inventory' && item.category === 'consumable') {
          actions.push(`<button data-economy-action="use" data-item-id="${item.id}">Použít</button>`);
        }
        if (context === 'buy') {
          actions.push(`<button data-economy-action="buy" data-item-id="${item.id}">Koupit · ${price}</button>`);
        }
        if (context === 'sell') {
          actions.push(`<button data-economy-action="sell" data-item-id="${item.id}">Prodat · ${price}</button>`);
        }

        return `
          <article class="item-row" data-item="${item.id}">
            <div class="item-copy">
              <div><strong>${item.name}</strong><span>×${stack.quantity}</span></div>
              <p>${item.description}</p>
              <small>${item.weight.toFixed(2)} kg / kus${equipped ? ' · vybaveno' : ''}</small>
            </div>
            <div class="item-actions">${actions.join('')}</div>
          </article>
        `;
      })
      .join('');
  }

  private handleAction(button: HTMLButtonElement): void {
    const action = button.dataset.economyAction;
    const itemId = this.parseItemId(button.dataset.itemId);
    const economy = getEconomyState();

    if (action === 'unequip') {
      const slot = button.dataset.slot as EquipmentSlot | undefined;
      if (!slot || !(slot in SLOT_LABELS)) return;
      setEconomyState({ ...economy, inventory: unequipSlot(economy.inventory, slot) });
      this.commitChange(`${SLOT_LABELS[slot]} byl sundán.`);
      return;
    }
    if (!itemId) return;

    if (action === 'equip') {
      const result = equipItem(economy.inventory, itemId);
      if (!result.ok) return this.setStatus(result.error.message);
      setEconomyState({ ...economy, inventory: result.value });
      this.commitChange(`${ITEM_DEFINITIONS[itemId].name} je vybaven.`);
      return;
    }

    if (action === 'use') {
      const result = useConsumable(economy.inventory, itemId);
      if (!result.ok) return this.setStatus(result.error.message);
      setEconomyState({ ...economy, inventory: result.value.inventory });
      EventBus.emit(GameEvents.CONSUMABLE_USED, {
        itemId,
        healing: result.value.healing
      });
      this.commitChange(`${ITEM_DEFINITIONS[itemId].name} použit.`);
      return;
    }

    if (action === 'buy') {
      const result = buyItem(economy, itemId);
      if (!result.ok) return this.setStatus(result.error.message);
      setEconomyState(result.value);
      this.commitChange(`${ITEM_DEFINITIONS[itemId].name} koupen.`);
      return;
    }

    if (action === 'sell') {
      const result = sellItem(economy, itemId);
      if (!result.ok) return this.setStatus(result.error.message);
      setEconomyState(result.value);
      this.commitChange(`${ITEM_DEFINITIONS[itemId].name} prodán.`);
    }
  }

  private commitChange(message: string): void {
    this.setStatus(message);
    EventBus.emit(GameEvents.ECONOMY_CHANGED);
    this.render();
  }

  private onContextChanged(): void {
    if (!this.isGameReady() && this.openState) this.close();
    if (this.mode === 'trade' && !this.canTrade()) this.mode = 'inventory';
    this.render();
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
    scene.physics.world.resume();
    if (scene.input.keyboard) scene.input.keyboard.enabled = true;
  }

  private canTrade(): boolean {
    return document.body.dataset.nearNpc === 'trader-katerina';
  }

  private isGameReady(): boolean {
    return (
      document.body.dataset.scene === 'game' &&
      document.body.dataset.saveReady === 'true'
    );
  }

  private setStatus(message: string): void {
    this.message.textContent = message;
    const liveStatus = document.querySelector<HTMLElement>('#game-status');
    if (liveStatus) liveStatus.textContent = message;
    document.body.dataset.economyMessage = message;
  }

  private parseItemId(value: string | undefined): ItemId | null {
    if (!value) return null;
    return Object.prototype.hasOwnProperty.call(ITEM_DEFINITIONS, value) ? (value as ItemId) : null;
  }

  private requireElement<T extends HTMLElement = HTMLElement>(selector: string): T {
    const element = document.querySelector<T>(selector);
    if (!element) throw new Error(`Required economy UI element is missing: ${selector}`);
    return element;
  }
}
