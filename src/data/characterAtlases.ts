export type CharacterAtlasKey =
  | 'player'
  | 'smith-bohdan'
  | 'innkeeper-marta'
  | 'guard-vojtech'
  | 'farmer-ondra'
  | 'herbalist-agnes'
  | 'miller-jakub'
  | 'priest-matej'
  | 'trader-katerina'
  | 'stablehand-pavel'
  | 'washerwoman-anna'
  | 'bandit';

export type CharacterFrameState =
  | 'idle'
  | 'walk-a'
  | 'walk-b'
  | 'action'
  | 'hurt'
  | 'sleep';

export type CharacterAccessory =
  | 'none'
  | 'sword'
  | 'hammer'
  | 'tankard'
  | 'spear'
  | 'hoe'
  | 'herb-basket'
  | 'flour-sack'
  | 'cross'
  | 'merchant-pouch'
  | 'horse-brush'
  | 'linen-basket'
  | 'club';

export type Headwear =
  | 'none'
  | 'hood'
  | 'cap'
  | 'helmet'
  | 'straw-hat'
  | 'veil'
  | 'cowl'
  | 'headscarf';

export interface CharacterPalette {
  outline: number;
  skin: number;
  skinShadow: number;
  hair: number;
  primary: number;
  primaryShadow: number;
  secondary: number;
  secondaryShadow: number;
  accent: number;
  metal: number;
}

export interface CharacterAtlasDefinition {
  key: CharacterAtlasKey;
  displayName: string;
  headwear: Headwear;
  accessory: CharacterAccessory;
  broadShoulders?: boolean;
  longGarment?: boolean;
  apron?: boolean;
  beard?: boolean;
  feminineSilhouette?: boolean;
  damaged?: boolean;
  palette: CharacterPalette;
}

const palette = (
  primary: number,
  primaryShadow: number,
  secondary: number,
  secondaryShadow: number,
  accent: number,
  hair = 0x4a3022,
  metal = 0xa6a9a5
): CharacterPalette => ({
  outline: 0x17130f,
  skin: 0xd4aa82,
  skinShadow: 0x9c6f53,
  hair,
  primary,
  primaryShadow,
  secondary,
  secondaryShadow,
  accent,
  metal
});

export const CHARACTER_FRAME_WIDTH = 20;
export const CHARACTER_FRAME_HEIGHT = 28;
export const CHARACTER_FRAME_STATES: readonly CharacterFrameState[] = [
  'idle',
  'walk-a',
  'walk-b',
  'action',
  'hurt',
  'sleep'
];

export const CHARACTER_ATLAS_DEFINITIONS: readonly CharacterAtlasDefinition[] = [
  {
    key: 'player',
    displayName: 'Jindřichův učedník',
    headwear: 'none',
    accessory: 'sword',
    palette: palette(0x9a6a35, 0x5f3d25, 0x33495c, 0x202d3a, 0xd0b06b, 0x4b2d1f)
  },
  {
    key: 'smith-bohdan',
    displayName: 'Kovář Bohdan',
    headwear: 'cap',
    accessory: 'hammer',
    broadShoulders: true,
    apron: true,
    beard: true,
    palette: palette(0x6f4930, 0x402b22, 0x302a27, 0x1d1918, 0xc2783c, 0x33241d, 0x9b8675)
  },
  {
    key: 'innkeeper-marta',
    displayName: 'Hostinská Marta',
    headwear: 'veil',
    accessory: 'tankard',
    apron: true,
    feminineSilhouette: true,
    palette: palette(0x9b6948, 0x65412f, 0x574239, 0x332a27, 0xe0c792, 0x56382d)
  },
  {
    key: 'guard-vojtech',
    displayName: 'Strážný Vojtěch',
    headwear: 'helmet',
    accessory: 'spear',
    broadShoulders: true,
    palette: palette(0x52677d, 0x324151, 0x4a4138, 0x28231f, 0xb64234, 0x3d2a20, 0xbcc2c0)
  },
  {
    key: 'farmer-ondra',
    displayName: 'Sedlák Ondra',
    headwear: 'straw-hat',
    accessory: 'hoe',
    palette: palette(0x786143, 0x4b3c2e, 0x4f5738, 0x303724, 0xc6a35e, 0x5d3e28)
  },
  {
    key: 'herbalist-agnes',
    displayName: 'Bylinkářka Anežka',
    headwear: 'hood',
    accessory: 'herb-basket',
    longGarment: true,
    feminineSilhouette: true,
    palette: palette(0x58724d, 0x34462f, 0x6b543f, 0x3d3026, 0xb6c676, 0x594131)
  },
  {
    key: 'miller-jakub',
    displayName: 'Mlynář Jakub',
    headwear: 'cap',
    accessory: 'flour-sack',
    apron: true,
    palette: palette(0xb1a58d, 0x746b5d, 0x5d5144, 0x342e28, 0xd9d0b8, 0x6a513b)
  },
  {
    key: 'priest-matej',
    displayName: 'Otec Matěj',
    headwear: 'cowl',
    accessory: 'cross',
    longGarment: true,
    palette: palette(0x3f3430, 0x241e1c, 0x2e2927, 0x191615, 0xc6a954, 0x5e4a38)
  },
  {
    key: 'trader-katerina',
    displayName: 'Kupkyně Kateřina',
    headwear: 'veil',
    accessory: 'merchant-pouch',
    longGarment: true,
    feminineSilhouette: true,
    palette: palette(0x7b3f46, 0x49272d, 0x40576a, 0x273642, 0xd4ad57, 0x3f2926)
  },
  {
    key: 'stablehand-pavel',
    displayName: 'Podkoní Pavel',
    headwear: 'hood',
    accessory: 'horse-brush',
    palette: palette(0x5a4937, 0x362c23, 0x675438, 0x3d3023, 0xb9824a, 0x493224)
  },
  {
    key: 'washerwoman-anna',
    displayName: 'Pradlena Anna',
    headwear: 'headscarf',
    accessory: 'linen-basket',
    apron: true,
    feminineSilhouette: true,
    palette: palette(0x526b72, 0x33454b, 0x8b735d, 0x554638, 0xd9c9a6, 0x63473b)
  },
  {
    key: 'bandit',
    displayName: 'Lapka',
    headwear: 'hood',
    accessory: 'club',
    broadShoulders: true,
    damaged: true,
    palette: palette(0x433b34, 0x28231f, 0x382727, 0x211718, 0x8f382f, 0x2b211c, 0x77736c)
  }
];

export const getCharacterAtlasDefinition = (
  key: CharacterAtlasKey
): CharacterAtlasDefinition => {
  const definition = CHARACTER_ATLAS_DEFINITIONS.find((candidate) => candidate.key === key);
  if (!definition) throw new Error(`Unknown character atlas ${key}.`);
  return definition;
};

export const getCharacterFrameIndex = (state: CharacterFrameState): number =>
  CHARACTER_FRAME_STATES.indexOf(state);

export const getCharacterAnimationKey = (
  key: CharacterAtlasKey,
  animation: 'idle' | 'walk' | 'action' | 'hurt' | 'sleep'
): string => `${key}:${animation}`;
