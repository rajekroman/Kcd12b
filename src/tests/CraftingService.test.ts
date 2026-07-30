import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../core/EventBus', () => {
  const listeners = new Map<string, Set<(payload?: unknown) => void>>();
  const eventBus = {
    once(event: string, listener: (payload?: unknown) => void): void {
      const onceListener = (payload?: unknown): void => {
        eventBus.removeListener(event, onceListener);
        listener(payload);
      };
      const eventListeners = listeners.get(event) ?? new Set();
      eventListeners.add(onceListener);
      listeners.set(event, eventListeners);
    },
    emit(event: string, payload?: unknown): void {
      for (const listener of [...(listeners.get(event) ?? [])]) listener(payload);
    },
    removeListener(event: string, listener: (payload?: unknown) => void): void {
      listeners.get(event)?.delete(listener);
    },
    removeAllListeners(event?: string): void {
      if (event) listeners.delete(event);
      else listeners.clear();
    }
  };

  return {
    EventBus: eventBus,
    GameEvents: {
      CRAFTING_COMPLETED: 'crafting:completed',
      ECONOMY_CHANGED: 'economy:changed'
    }
  };
});

import { executeCraftingCommand, type CraftingCompletedEvent } from '../application/CraftingService';
import { EventBus, GameEvents } from '../core/EventBus';
import { getEconomyState, resetEconomyState, setEconomyState } from '../core/EconomyStore';
import { addItem, getItemQuantity } from '../systems/InventorySystem';

describe('CraftingService', () => {
  afterEach(() => {
    EventBus.removeAllListeners(GameEvents.CRAFTING_COMPLETED);
    EventBus.removeAllListeners(GameEvents.ECONOMY_CHANGED);
    resetEconomyState();
  });

  it('atomicky aktualizuje EconomyStore a publikuje potvrzený event', () => {
    const economy = resetEconomyState();
    const herbs = addItem(economy.inventory, 'healing-herbs', 2);
    if (!herbs.ok) throw new Error(herbs.error.message);
    setEconomyState({ ...economy, inventory: herbs.value });

    const listener = vi.fn<(event: CraftingCompletedEvent) => void>();
    EventBus.once(GameEvents.CRAFTING_COMPLETED, listener);

    const result = executeCraftingCommand('herbal-poultice', 'alchemy');

    expect(result.ok).toBe(true);
    expect(getItemQuantity(getEconomyState().inventory.items, 'healing-herbs')).toBe(0);
    expect(getItemQuantity(getEconomyState().inventory.items, 'herbal-poultice')).toBe(1);
    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0]?.[0]).toMatchObject({
      recipeId: 'herbal-poultice',
      station: 'alchemy'
    });
  });

  it('při nesprávné stanici nemění store ani nepublikuje event', () => {
    const before = structuredClone(resetEconomyState());
    const listener = vi.fn();
    EventBus.once(GameEvents.CRAFTING_COMPLETED, listener);

    const result = executeCraftingCommand('herbal-poultice', 'forge');

    expect(result.ok).toBe(false);
    expect(getEconomyState()).toEqual(before);
    expect(listener).not.toHaveBeenCalled();
  });
});
