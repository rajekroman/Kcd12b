export type ItemId =
  | 'bohdan-sword'
  | 'wood-axe'
  | 'padded-jack'
  | 'mail-coif'
  | 'silver-ring'
  | 'bread'
  | 'bandage'
  | 'healing-herbs'
  | 'iron-ingot';

export type ItemCategory = 'weapon' | 'armor' | 'accessory' | 'consumable' | 'material';
export type EquipmentSlot = 'weapon' | 'armor' | 'accessory';

export interface ItemStats {
  attack?: number;
  armor?: number;
  charisma?: number;
  healing?: number;
}

export interface ItemDefinition {
  id: ItemId;
  name: string;
  description: string;
  category: ItemCategory;
  equipmentSlot?: EquipmentSlot;
  weight: number;
  maxStack: number;
  buyPrice: number;
  sellPrice: number;
  stats: ItemStats;
}

export interface ItemStackDefinition {
  itemId: ItemId;
  quantity: number;
}

export const ITEM_DEFINITIONS: Record<ItemId, ItemDefinition> = {
  'bohdan-sword': {
    id: 'bohdan-sword',
    name: 'Bohdanův cvičný meč',
    description: 'Poctivá jednoruční čepel, těžší než vypadá.',
    category: 'weapon',
    equipmentSlot: 'weapon',
    weight: 2.8,
    maxStack: 1,
    buyPrice: 120,
    sellPrice: 58,
    stats: { attack: 5 }
  },
  'wood-axe': {
    id: 'wood-axe',
    name: 'Dřevorubecká sekera',
    description: 'Pracovní nástroj, který obstojí i v nouzovém boji.',
    category: 'weapon',
    equipmentSlot: 'weapon',
    weight: 3.4,
    maxStack: 1,
    buyPrice: 82,
    sellPrice: 39,
    stats: { attack: 3 }
  },
  'padded-jack': {
    id: 'padded-jack',
    name: 'Prošívanice',
    description: 'Silně prošívaný kabátec tlumící sečné i tupé rány.',
    category: 'armor',
    equipmentSlot: 'armor',
    weight: 4.6,
    maxStack: 1,
    buyPrice: 168,
    sellPrice: 80,
    stats: { armor: 4 }
  },
  'mail-coif': {
    id: 'mail-coif',
    name: 'Kroužková kukla',
    description: 'Kroužková ochrana hlavy a krku.',
    category: 'armor',
    equipmentSlot: 'armor',
    weight: 3.9,
    maxStack: 1,
    buyPrice: 245,
    sellPrice: 116,
    stats: { armor: 6 }
  },
  'silver-ring': {
    id: 'silver-ring',
    name: 'Stříbrný prsten',
    description: 'Nenápadný šperk, který působí důvěryhodněji než chudý oděv.',
    category: 'accessory',
    equipmentSlot: 'accessory',
    weight: 0.1,
    maxStack: 1,
    buyPrice: 95,
    sellPrice: 44,
    stats: { charisma: 2 }
  },
  bread: {
    id: 'bread',
    name: 'Bochník chleba',
    description: 'Tvrdší, ale stále poctivý žitný chléb.',
    category: 'consumable',
    weight: 0.6,
    maxStack: 10,
    buyPrice: 6,
    sellPrice: 2,
    stats: { healing: 4 }
  },
  bandage: {
    id: 'bandage',
    name: 'Čistý obvaz',
    description: 'Plátno připravené k zastavení krvácení.',
    category: 'consumable',
    weight: 0.2,
    maxStack: 10,
    buyPrice: 14,
    sellPrice: 6,
    stats: { healing: 12 }
  },
  'healing-herbs': {
    id: 'healing-herbs',
    name: 'Léčivé byliny',
    description: 'Směs jitrocele, řebříčku a sušené šalvěje.',
    category: 'material',
    weight: 0.15,
    maxStack: 20,
    buyPrice: 9,
    sellPrice: 4,
    stats: {}
  },
  'iron-ingot': {
    id: 'iron-ingot',
    name: 'Železný ingot',
    description: 'Surovina pro kováře a těžká zátěž pro cestovatele.',
    category: 'material',
    weight: 2.2,
    maxStack: 5,
    buyPrice: 35,
    sellPrice: 17,
    stats: {}
  }
};

export const INITIAL_PLAYER_ITEMS: readonly ItemStackDefinition[] = [
  { itemId: 'bohdan-sword', quantity: 1 },
  { itemId: 'bread', quantity: 2 },
  { itemId: 'bandage', quantity: 1 }
];

export const KATERINA_INITIAL_STOCK: readonly ItemStackDefinition[] = [
  { itemId: 'wood-axe', quantity: 1 },
  { itemId: 'padded-jack', quantity: 1 },
  { itemId: 'mail-coif', quantity: 1 },
  { itemId: 'silver-ring', quantity: 1 },
  { itemId: 'bread', quantity: 8 },
  { itemId: 'bandage', quantity: 5 },
  { itemId: 'healing-herbs', quantity: 12 },
  { itemId: 'iron-ingot', quantity: 3 }
];
