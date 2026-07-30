import { getEconomyState, setEconomyState } from '../core/EconomyStore';
import { EventBus, GameEvents } from '../core/EventBus';
import type { CraftingStation, RecipeId } from '../data/crafting';
import {
  craftRecipe,
  getCraftingValidation,
  type CraftingResult
} from '../systems/CraftingSystem';
import type { InventoryError, InventoryResult } from '../systems/InventorySystem';

export interface CraftingCompletedEvent {
  recipeId: RecipeId;
  station: CraftingStation;
  inventory: CraftingResult['inventory'];
}

const stationMismatchError = (): InventoryError => ({
  code: 'item-missing',
  message: 'Tento recept patří k jiné řemeslné stanici.'
});

export const executeCraftingCommand = (
  recipeId: RecipeId,
  station: CraftingStation
): InventoryResult<CraftingResult> => {
  const economy = getEconomyState();
  const validation = getCraftingValidation(economy.inventory, recipeId);

  if (validation.recipe.station !== station) {
    return { ok: false, error: stationMismatchError() };
  }

  if (!validation.canCraft) {
    return {
      ok: false,
      error: validation.error ?? {
        code: 'item-missing',
        message: 'Recept nyní nelze vyrobit.'
      }
    };
  }

  const result = craftRecipe(economy.inventory, recipeId);
  if (!result.ok) return result;

  setEconomyState({ ...economy, inventory: result.value.inventory });

  const event: CraftingCompletedEvent = {
    recipeId,
    station,
    inventory: result.value.inventory
  };
  EventBus.emit(GameEvents.CRAFTING_COMPLETED, event);
  EventBus.emit(GameEvents.ECONOMY_CHANGED);

  return result;
};
