import { describe, expect, it } from 'vitest';
import {
  CRAFTING_RECIPES,
  CRAFTING_STATIONS,
  getCraftingRecipe,
  getRecipesForStation
} from '../data/crafting';
import { ITEM_DEFINITIONS } from '../data/items';
import {
  addItem,
  createInitialInventoryState,
  getItemQuantity,
  type InventoryState
} from '../systems/InventorySystem';
import {
  craftRecipe,
  getCraftingStationForNpc,
  getCraftingValidation
} from '../systems/CraftingSystem';

const withItems = (
  inventory: InventoryState,
  items: Array<[Parameters<typeof addItem>[1], number]>
): InventoryState =>
  items.reduce((state, [itemId, quantity]) => {
    const result = addItem(state, itemId, quantity);
    if (!result.ok) throw new Error(result.error.message);
    return result.value;
  }, inventory);

describe('CraftingSystem', () => {
  it('definuje dvě stanice a pět stabilních receptů', () => {
    expect(Object.keys(CRAFTING_STATIONS)).toEqual(['alchemy', 'forge']);
    expect(CRAFTING_RECIPES).toHaveLength(5);
    expect(new Set(CRAFTING_RECIPES.map((recipe) => recipe.id)).size).toBe(5);
    expect(getRecipesForStation('alchemy')).toHaveLength(2);
    expect(getRecipesForStation('forge')).toHaveLength(3);
  });

  it('mapuje Anežku a Bohdana na správné stanice', () => {
    expect(getCraftingStationForNpc('herbalist-agnes')).toBe('alchemy');
    expect(getCraftingStationForNpc('smith-bohdan')).toBe('forge');
    expect(getCraftingStationForNpc('trader-katerina')).toBeNull();
    expect(getCraftingStationForNpc(undefined)).toBeNull();
  });

  it('vyrobí bylinný obklad a atomicky spotřebuje suroviny', () => {
    const inventory = withItems(createInitialInventoryState(), [['healing-herbs', 2]]);
    const result = craftRecipe(inventory, 'herbal-poultice');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(getItemQuantity(result.value.inventory.items, 'healing-herbs')).toBe(0);
      expect(getItemQuantity(result.value.inventory.items, 'bandage')).toBe(0);
      expect(getItemQuantity(result.value.inventory.items, 'herbal-poultice')).toBe(1);
    }
    expect(getItemQuantity(inventory.items, 'healing-herbs')).toBe(2);
    expect(getItemQuantity(inventory.items, 'bandage')).toBe(1);
  });

  it('zakalí vybavený meč a uvolní starý equipment slot', () => {
    const inventory = withItems(createInitialInventoryState(), [['iron-ingot', 1]]);
    const result = craftRecipe(inventory, 'temper-sword');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(getItemQuantity(result.value.inventory.items, 'bohdan-sword')).toBe(0);
      expect(getItemQuantity(result.value.inventory.items, 'tempered-sword')).toBe(1);
      expect(result.value.inventory.equipment.weapon).toBeNull();
    }
  });

  it('neodebere nic, když chybí poslední surovina', () => {
    const inventory = withItems(createInitialInventoryState(), [['leather-straps', 2]]);
    const before = structuredClone(inventory);
    const result = craftRecipe(inventory, 'reinforce-jack');

    expect(result.ok).toBe(false);
    expect(inventory).toEqual(before);
    expect(getItemQuantity(inventory.items, 'leather-straps')).toBe(2);
  });

  it('neodebere nic, když výstup překročí stack limit', () => {
    const base = withItems(createInitialInventoryState(), [
      ['healing-herbs', 2],
      ['herbal-poultice', 10]
    ]);
    const before = structuredClone(base);
    const result = craftRecipe(base, 'herbal-poultice');

    expect(result.ok).toBe(false);
    expect(result.ok ? null : result.error.code).toBe('stack-full');
    expect(base).toEqual(before);
  });

  it('vrátí původní inventář, když až výstup překročí nosnost', () => {
    const base = withItems(createInitialInventoryState(), [['healing-herbs', 2]]);
    const constrained = { ...base, maxWeight: 4.6 };
    const before = structuredClone(constrained);
    const originalWeight = ITEM_DEFINITIONS['herbal-poultice'].weight;

    ITEM_DEFINITIONS['herbal-poultice'].weight = 1;
    try {
      const result = craftRecipe(constrained, 'herbal-poultice');

      expect(result.ok).toBe(false);
      expect(result.ok ? null : result.error.code).toBe('overweight');
      expect(constrained).toEqual(before);
      expect(getItemQuantity(constrained.items, 'healing-herbs')).toBe(2);
      expect(getItemQuantity(constrained.items, 'bandage')).toBe(1);
      expect(getItemQuantity(constrained.items, 'herbal-poultice')).toBe(0);
    } finally {
      ITEM_DEFINITIONS['herbal-poultice'].weight = originalWeight;
    }
  });

  it('validace vrátí přesné dostupné množství a důvod blokace', () => {
    const validation = getCraftingValidation(
      createInitialInventoryState(),
      'herbal-poultice'
    );

    expect(validation.canCraft).toBe(false);
    expect(validation.ingredients).toEqual([
      {
        itemId: 'healing-herbs',
        quantity: 2,
        available: 0,
        sufficient: false
      },
      {
        itemId: 'bandage',
        quantity: 1,
        available: 1,
        sufficient: true
      }
    ]);
    expect(validation.error?.message).toContain('Léčivé byliny');
  });

  it('nařeže jednu kůži na dva řemeny', () => {
    const inventory = withItems(createInitialInventoryState(), [['deer-hide', 1]]);
    const result = craftRecipe(inventory, 'cut-leather-straps');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(getItemQuantity(result.value.inventory.items, 'deer-hide')).toBe(0);
      expect(getItemQuantity(result.value.inventory.items, 'leather-straps')).toBe(2);
    }
  });

  it('neznámý recept je explicitní datová chyba', () => {
    expect(() => getCraftingRecipe('unknown' as never)).toThrow(
      'Unknown crafting recipe unknown'
    );
  });
});
