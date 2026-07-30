import type { ItemId, ItemStackDefinition } from './items';
import type { NpcId } from './npcs';

export type CraftingStation = 'alchemy' | 'forge';
export type RecipeId =
  | 'herbal-poultice'
  | 'preserved-venison'
  | 'cut-leather-straps'
  | 'temper-sword'
  | 'reinforce-jack';

export interface CraftingStationDefinition {
  id: CraftingStation;
  label: string;
  description: string;
  npcId: NpcId;
  actionLabel: string;
}

export interface CraftingRecipe {
  id: RecipeId;
  station: CraftingStation;
  name: string;
  description: string;
  ingredients: readonly ItemStackDefinition[];
  outputs: readonly ItemStackDefinition[];
}

export const CRAFTING_STATIONS: Record<CraftingStation, CraftingStationDefinition> = {
  alchemy: {
    id: 'alchemy',
    label: 'Anežčin bylinkářský stůl',
    description: 'Drť byliny, míchej obklady a konzervuj maso.',
    npcId: 'herbalist-agnes',
    actionLabel: 'Vyrobit'
  },
  forge: {
    id: 'forge',
    label: 'Bohdanova kovárna',
    description: 'Překovávej čepele a vyztužuj zbroj.',
    npcId: 'smith-bohdan',
    actionLabel: 'Vykovat'
  }
};

export const CRAFTING_RECIPES: readonly CraftingRecipe[] = [
  {
    id: 'herbal-poultice',
    station: 'alchemy',
    name: 'Bylinný obklad',
    description: 'Silný léčivý obklad z rozdrcených bylin a čistého plátna.',
    ingredients: [
      { itemId: 'healing-herbs', quantity: 2 },
      { itemId: 'bandage', quantity: 1 }
    ],
    outputs: [{ itemId: 'herbal-poultice', quantity: 1 }]
  },
  {
    id: 'preserved-venison',
    station: 'alchemy',
    name: 'Konzervovaná zvěřina',
    description: 'Srnčí maso ošetřené bylinami pro delší cestu.',
    ingredients: [
      { itemId: 'venison', quantity: 1 },
      { itemId: 'healing-herbs', quantity: 1 }
    ],
    outputs: [{ itemId: 'preserved-venison', quantity: 1 }]
  },
  {
    id: 'cut-leather-straps',
    station: 'forge',
    name: 'Nařezat kožené řemeny',
    description: 'Srnčí kůže rozřezaná, vyhlazená a promaštěná pro další výrobu.',
    ingredients: [{ itemId: 'deer-hide', quantity: 1 }],
    outputs: [{ itemId: 'leather-straps', quantity: 2 }]
  },
  {
    id: 'temper-sword',
    station: 'forge',
    name: 'Zakalení Bohdanova meče',
    description: 'Překování a zakalení cvičné čepele pro vyšší účinek.',
    ingredients: [
      { itemId: 'bohdan-sword', quantity: 1 },
      { itemId: 'iron-ingot', quantity: 1 }
    ],
    outputs: [{ itemId: 'tempered-sword', quantity: 1 }]
  },
  {
    id: 'reinforce-jack',
    station: 'forge',
    name: 'Vyztužení prošívanice',
    description: 'Kožené řemeny a železné lamely zpevní prošívanou zbroj.',
    ingredients: [
      { itemId: 'padded-jack', quantity: 1 },
      { itemId: 'leather-straps', quantity: 2 },
      { itemId: 'iron-ingot', quantity: 1 }
    ],
    outputs: [{ itemId: 'reinforced-jack', quantity: 1 }]
  }
];

export const getRecipesForStation = (
  station: CraftingStation
): readonly CraftingRecipe[] => CRAFTING_RECIPES.filter((recipe) => recipe.station === station);

export const getCraftingRecipe = (id: RecipeId): CraftingRecipe => {
  const recipe = CRAFTING_RECIPES.find((candidate) => candidate.id === id);
  if (!recipe) throw new Error(`Unknown crafting recipe ${id}.`);
  return recipe;
};

export const isRecipeId = (value: unknown): value is RecipeId =>
  typeof value === 'string' && CRAFTING_RECIPES.some((recipe) => recipe.id === value);

export const getRecipeOutputIds = (recipe: CraftingRecipe): readonly ItemId[] =>
  recipe.outputs.map((output) => output.itemId);
