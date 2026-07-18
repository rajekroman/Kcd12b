import {
  INITIAL_PLAYER_ITEMS,
  ITEM_DEFINITIONS,
  KATERINA_INITIAL_STOCK,
  type EquipmentSlot,
  type ItemId,
  type ItemStackDefinition
} from '../data/items';
import {
  calculateReputationPrice,
  type TradeReputationContext
} from './ReputationSystem';

export interface InventoryStack {
  itemId: ItemId;
  quantity: number;
}

export interface EquipmentState {
  weapon: ItemId | null;
  armor: ItemId | null;
  accessory: ItemId | null;
}

export interface InventoryState {
  groschen: number;
  maxWeight: number;
  items: InventoryStack[];
  equipment: EquipmentState;
}

export interface MerchantState {
  id: 'trader-katerina';
  groschen: number;
  stock: InventoryStack[];
}

export interface EconomyState {
  inventory: InventoryState;
  merchant: MerchantState;
}

export interface EquipmentStats {
  attack: number;
  armor: number;
  charisma: number;
}

export type InventoryErrorCode =
  | 'invalid-quantity'
  | 'unknown-item'
  | 'stack-full'
  | 'overweight'
  | 'item-missing'
  | 'not-equippable'
  | 'insufficient-funds'
  | 'merchant-out-of-stock'
  | 'merchant-insufficient-funds'
  | 'not-consumable';

export interface InventoryError {
  code: InventoryErrorCode;
  message: string;
}

export type InventoryResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: InventoryError };

export interface ConsumableUseResult {
  inventory: InventoryState;
  healing: number;
}

const NEUTRAL_PRICING: TradeReputationContext = {
  factionReputation: 0,
  charisma: 0
};

const cloneStacks = (stacks: readonly ItemStackDefinition[]): InventoryStack[] =>
  stacks.map((stack) => ({ ...stack }));

const fail = <T>(code: InventoryErrorCode, message: string): InventoryResult<T> => ({
  ok: false,
  error: { code, message }
});

const validQuantity = (quantity: number): boolean =>
  Number.isInteger(quantity) && quantity > 0;

export const createInitialInventoryState = (): InventoryState => ({
  groschen: 85,
  maxWeight: 25,
  items: cloneStacks(INITIAL_PLAYER_ITEMS),
  equipment: {
    weapon: 'bohdan-sword',
    armor: null,
    accessory: null
  }
});

export const createInitialMerchantState = (): MerchantState => ({
  id: 'trader-katerina',
  groschen: 500,
  stock: cloneStacks(KATERINA_INITIAL_STOCK)
});

export const createInitialEconomyState = (): EconomyState => ({
  inventory: createInitialInventoryState(),
  merchant: createInitialMerchantState()
});

export const getItemQuantity = (
  stacks: readonly InventoryStack[],
  itemId: ItemId
): number => stacks.find((stack) => stack.itemId === itemId)?.quantity ?? 0;

export const getInventoryWeight = (inventory: InventoryState): number =>
  inventory.items.reduce(
    (total, stack) => total + ITEM_DEFINITIONS[stack.itemId].weight * stack.quantity,
    0
  );

export const getEquipmentStats = (inventory: InventoryState): EquipmentStats => {
  const equippedIds = Object.values(inventory.equipment).filter(
    (itemId): itemId is ItemId => itemId !== null
  );

  return equippedIds.reduce<EquipmentStats>(
    (stats, itemId) => {
      const itemStats = ITEM_DEFINITIONS[itemId].stats;
      return {
        attack: stats.attack + (itemStats.attack ?? 0),
        armor: stats.armor + (itemStats.armor ?? 0),
        charisma: stats.charisma + (itemStats.charisma ?? 0)
      };
    },
    { attack: 0, armor: 0, charisma: 0 }
  );
};

export const getItemTradePrice = (
  itemId: ItemId,
  direction: 'buy' | 'sell',
  context: TradeReputationContext = NEUTRAL_PRICING
): number => {
  const definition = ITEM_DEFINITIONS[itemId];
  const basePrice = direction === 'buy' ? definition.buyPrice : definition.sellPrice;
  return calculateReputationPrice(basePrice, direction, context);
};

export const addItem = (
  inventory: InventoryState,
  itemId: ItemId,
  quantity = 1
): InventoryResult<InventoryState> => {
  if (!validQuantity(quantity)) return fail('invalid-quantity', 'Množství musí být kladné celé číslo.');
  const definition = ITEM_DEFINITIONS[itemId];
  if (!definition) return fail('unknown-item', 'Neznámý předmět.');

  const currentQuantity = getItemQuantity(inventory.items, itemId);
  if (currentQuantity + quantity > definition.maxStack) {
    return fail('stack-full', `Nelze nést více než ${definition.maxStack} kusů.`);
  }

  const nextWeight = getInventoryWeight(inventory) + definition.weight * quantity;
  if (nextWeight > inventory.maxWeight + Number.EPSILON) {
    return fail('overweight', 'Předmět by překročil nosnost inventáře.');
  }

  const items = currentQuantity
    ? inventory.items.map((stack) =>
        stack.itemId === itemId ? { ...stack, quantity: stack.quantity + quantity } : stack
      )
    : [...inventory.items, { itemId, quantity }];

  return { ok: true, value: { ...inventory, items } };
};

export const removeItem = (
  inventory: InventoryState,
  itemId: ItemId,
  quantity = 1
): InventoryResult<InventoryState> => {
  if (!validQuantity(quantity)) return fail('invalid-quantity', 'Množství musí být kladné celé číslo.');
  const currentQuantity = getItemQuantity(inventory.items, itemId);
  if (currentQuantity < quantity) return fail('item-missing', 'V inventáři není dost kusů.');

  const remaining = currentQuantity - quantity;
  const items = remaining === 0
    ? inventory.items.filter((stack) => stack.itemId !== itemId)
    : inventory.items.map((stack) =>
        stack.itemId === itemId ? { ...stack, quantity: remaining } : stack
      );

  const equipment = { ...inventory.equipment };
  for (const slot of Object.keys(equipment) as EquipmentSlot[]) {
    if (equipment[slot] === itemId && remaining === 0) equipment[slot] = null;
  }

  return { ok: true, value: { ...inventory, items, equipment } };
};

export const equipItem = (
  inventory: InventoryState,
  itemId: ItemId
): InventoryResult<InventoryState> => {
  if (getItemQuantity(inventory.items, itemId) < 1) {
    return fail('item-missing', 'Předmět není v inventáři.');
  }
  const definition = ITEM_DEFINITIONS[itemId];
  if (!definition.equipmentSlot) return fail('not-equippable', 'Tento předmět nelze vybavit.');

  return {
    ok: true,
    value: {
      ...inventory,
      equipment: {
        ...inventory.equipment,
        [definition.equipmentSlot]: itemId
      }
    }
  };
};

export const unequipSlot = (
  inventory: InventoryState,
  slot: EquipmentSlot
): InventoryState => ({
  ...inventory,
  equipment: { ...inventory.equipment, [slot]: null }
});

const updateMerchantStock = (
  stock: readonly InventoryStack[],
  itemId: ItemId,
  quantityDelta: number
): InventoryStack[] => {
  const current = getItemQuantity(stock, itemId);
  const next = current + quantityDelta;
  if (next <= 0) return stock.filter((stack) => stack.itemId !== itemId);
  if (current === 0) return [...stock, { itemId, quantity: next }];
  return stock.map((stack) => (stack.itemId === itemId ? { ...stack, quantity: next } : stack));
};

export const buyItem = (
  economy: EconomyState,
  itemId: ItemId,
  quantity = 1,
  pricingContext: TradeReputationContext = NEUTRAL_PRICING
): InventoryResult<EconomyState> => {
  if (!validQuantity(quantity)) return fail('invalid-quantity', 'Množství musí být kladné celé číslo.');
  const stockQuantity = getItemQuantity(economy.merchant.stock, itemId);
  if (stockQuantity < quantity) return fail('merchant-out-of-stock', 'Obchodník nemá dost kusů.');

  const price = getItemTradePrice(itemId, 'buy', pricingContext) * quantity;
  if (economy.inventory.groschen < price) {
    return fail('insufficient-funds', 'Nemáš dost grošů.');
  }

  const added = addItem(economy.inventory, itemId, quantity);
  if (!added.ok) return added;

  return {
    ok: true,
    value: {
      inventory: { ...added.value, groschen: added.value.groschen - price },
      merchant: {
        ...economy.merchant,
        groschen: economy.merchant.groschen + price,
        stock: updateMerchantStock(economy.merchant.stock, itemId, -quantity)
      }
    }
  };
};

export const sellItem = (
  economy: EconomyState,
  itemId: ItemId,
  quantity = 1,
  pricingContext: TradeReputationContext = NEUTRAL_PRICING
): InventoryResult<EconomyState> => {
  if (!validQuantity(quantity)) return fail('invalid-quantity', 'Množství musí být kladné celé číslo.');
  if (getItemQuantity(economy.inventory.items, itemId) < quantity) {
    return fail('item-missing', 'V inventáři není dost kusů.');
  }

  const price = getItemTradePrice(itemId, 'sell', pricingContext) * quantity;
  if (economy.merchant.groschen < price) {
    return fail('merchant-insufficient-funds', 'Obchodník nemá dost hotovosti.');
  }

  const removed = removeItem(economy.inventory, itemId, quantity);
  if (!removed.ok) return removed;

  return {
    ok: true,
    value: {
      inventory: { ...removed.value, groschen: removed.value.groschen + price },
      merchant: {
        ...economy.merchant,
        groschen: economy.merchant.groschen - price,
        stock: updateMerchantStock(economy.merchant.stock, itemId, quantity)
      }
    }
  };
};

export const useConsumable = (
  inventory: InventoryState,
  itemId: ItemId
): InventoryResult<ConsumableUseResult> => {
  const definition = ITEM_DEFINITIONS[itemId];
  if (definition.category !== 'consumable') {
    return fail('not-consumable', 'Tento předmět nelze spotřebovat.');
  }
  const removed = removeItem(inventory, itemId, 1);
  if (!removed.ok) return removed;

  return {
    ok: true,
    value: {
      inventory: removed.value,
      healing: definition.stats.healing ?? 0
    }
  };
};
