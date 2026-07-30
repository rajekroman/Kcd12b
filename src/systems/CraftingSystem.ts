import {
  CRAFTING_STATIONS,
  getCraftingRecipe,
  type CraftingRecipe,
  type CraftingStation,
  type RecipeId
} from '../data/crafting';
import { ITEM_DEFINITIONS, type ItemStackDefinition } from '../data/items';
import type { NpcId } from '../data/npcs';
import {
  addItem,
  getItemQuantity,
  removeItem,
  type InventoryError,
  type InventoryResult,
  type InventoryState
} from './InventorySystem';

export interface CraftingIngredientStatus extends ItemStackDefinition {
  available: number;
  sufficient: boolean;
}

export interface CraftingValidation {
  recipe: CraftingRecipe;
  ingredients: readonly CraftingIngredientStatus[];
  canCraft: boolean;
  error?: InventoryError;
}

export interface CraftingResult {
  inventory: InventoryState;
  recipe: CraftingRecipe;
}

const missingIngredientError = (recipe: CraftingRecipe): InventoryError => {
  const missing = recipe.ingredients.find(
    (ingredient) => ingredient.quantity > 0
  );
  return {
    code: 'item-missing',
    message: missing
      ? `Chybí suroviny pro recept ${recipe.name}.`
      : `Recept ${recipe.name} nemá platné suroviny.`
  };
};

export const getCraftingStationForNpc = (npcId: NpcId | undefined): CraftingStation | null => {
  if (!npcId) return null;
  const station = Object.values(CRAFTING_STATIONS).find(
    (candidate) => candidate.npcId === npcId
  );
  return station?.id ?? null;
};

export const getCraftingValidation = (
  inventory: InventoryState,
  recipeId: RecipeId
): CraftingValidation => {
  const recipe = getCraftingRecipe(recipeId);
  const ingredients = recipe.ingredients.map((ingredient) => {
    const available = getItemQuantity(inventory.items, ingredient.itemId);
    return {
      ...ingredient,
      available,
      sufficient: available >= ingredient.quantity
    };
  });

  const missing = ingredients.find((ingredient) => !ingredient.sufficient);
  if (missing) {
    return {
      recipe,
      ingredients,
      canCraft: false,
      error: {
        code: 'item-missing',
        message: `Chybí ${ITEM_DEFINITIONS[missing.itemId].name}: ${missing.available}/${missing.quantity}.`
      }
    };
  }

  const result = craftRecipe(inventory, recipeId);
  return {
    recipe,
    ingredients,
    canCraft: result.ok,
    error: result.ok ? undefined : result.error
  };
};

export const craftRecipe = (
  inventory: InventoryState,
  recipeId: RecipeId
): InventoryResult<CraftingResult> => {
  const recipe = getCraftingRecipe(recipeId);
  let nextInventory = structuredClone(inventory);

  for (const ingredient of recipe.ingredients) {
    if (getItemQuantity(nextInventory.items, ingredient.itemId) < ingredient.quantity) {
      return { ok: false, error: missingIngredientError(recipe) };
    }
    const removal = removeItem(nextInventory, ingredient.itemId, ingredient.quantity);
    if (!removal.ok) return { ok: false, error: removal.error };
    nextInventory = removal.value;
  }

  for (const output of recipe.outputs) {
    const addition = addItem(nextInventory, output.itemId, output.quantity);
    if (!addition.ok) return { ok: false, error: addition.error };
    nextInventory = addition.value;
  }

  return { ok: true, value: { inventory: nextInventory, recipe } };
};
