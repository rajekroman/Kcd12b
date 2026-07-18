import type { CharacterAtlasKey, Headwear } from './characterAtlases';
import type { NpcId } from './npcs';

export type PortraitExpression =
  | 'neutral'
  | 'warm'
  | 'stern'
  | 'concerned'
  | 'suspicious'
  | 'proud';

export type FaceShape = 'round' | 'square' | 'narrow' | 'broad';
export type PortraitMark = 'none' | 'scar' | 'freckles' | 'wrinkles' | 'flour' | 'dirt';

export interface PortraitDefinition {
  npcId: NpcId;
  atlasKey: CharacterAtlasKey;
  faceShape: FaceShape;
  headwear: Headwear;
  mark: PortraitMark;
  beard?: boolean;
  moustache?: boolean;
  longHair?: boolean;
  ageLines?: boolean;
  eyeColor: number;
  background: number;
  backgroundAccent: number;
}

export const PORTRAIT_WIDTH = 48;
export const PORTRAIT_HEIGHT = 56;
export const PORTRAIT_EXPRESSIONS: readonly PortraitExpression[] = [
  'neutral',
  'warm',
  'stern',
  'concerned',
  'suspicious',
  'proud'
];

export const PORTRAIT_DEFINITIONS: readonly PortraitDefinition[] = [
  {
    npcId: 'smith-bohdan',
    atlasKey: 'smith-bohdan',
    faceShape: 'broad',
    headwear: 'cap',
    mark: 'scar',
    beard: true,
    ageLines: true,
    eyeColor: 0x56422d,
    background: 0x3a2620,
    backgroundAccent: 0xa55c32
  },
  {
    npcId: 'innkeeper-marta',
    atlasKey: 'innkeeper-marta',
    faceShape: 'round',
    headwear: 'veil',
    mark: 'freckles',
    ageLines: true,
    eyeColor: 0x52616b,
    background: 0x47332c,
    backgroundAccent: 0xb17a52
  },
  {
    npcId: 'guard-vojtech',
    atlasKey: 'guard-vojtech',
    faceShape: 'square',
    headwear: 'helmet',
    mark: 'scar',
    moustache: true,
    eyeColor: 0x50606b,
    background: 0x263442,
    backgroundAccent: 0x9e3e35
  },
  {
    npcId: 'farmer-ondra',
    atlasKey: 'farmer-ondra',
    faceShape: 'broad',
    headwear: 'straw-hat',
    mark: 'dirt',
    beard: true,
    eyeColor: 0x67533a,
    background: 0x39402b,
    backgroundAccent: 0xb19253
  },
  {
    npcId: 'herbalist-agnes',
    atlasKey: 'herbalist-agnes',
    faceShape: 'narrow',
    headwear: 'hood',
    mark: 'freckles',
    longHair: true,
    eyeColor: 0x537458,
    background: 0x2f452d,
    backgroundAccent: 0x9aaa5e
  },
  {
    npcId: 'miller-jakub',
    atlasKey: 'miller-jakub',
    faceShape: 'round',
    headwear: 'cap',
    mark: 'flour',
    moustache: true,
    eyeColor: 0x5d5144,
    background: 0x4a443b,
    backgroundAccent: 0xbeb49b
  },
  {
    npcId: 'priest-matej',
    atlasKey: 'priest-matej',
    faceShape: 'narrow',
    headwear: 'cowl',
    mark: 'wrinkles',
    ageLines: true,
    eyeColor: 0x4c4038,
    background: 0x29221f,
    backgroundAccent: 0xa88b49
  },
  {
    npcId: 'trader-katerina',
    atlasKey: 'trader-katerina',
    faceShape: 'narrow',
    headwear: 'veil',
    mark: 'none',
    longHair: true,
    eyeColor: 0x445d68,
    background: 0x46272e,
    backgroundAccent: 0xc39a4d
  },
  {
    npcId: 'stablehand-pavel',
    atlasKey: 'stablehand-pavel',
    faceShape: 'square',
    headwear: 'hood',
    mark: 'dirt',
    beard: true,
    eyeColor: 0x5d4934,
    background: 0x3a3026,
    backgroundAccent: 0xa66f3e
  },
  {
    npcId: 'washerwoman-anna',
    atlasKey: 'washerwoman-anna',
    faceShape: 'round',
    headwear: 'headscarf',
    mark: 'wrinkles',
    ageLines: true,
    eyeColor: 0x506a72,
    background: 0x304348,
    backgroundAccent: 0xb8a989
  }
];

export const getPortraitDefinition = (npcId: NpcId): PortraitDefinition => {
  const definition = PORTRAIT_DEFINITIONS.find((candidate) => candidate.npcId === npcId);
  if (!definition) throw new Error(`Unknown portrait definition ${npcId}.`);
  return definition;
};

export const getPortraitFrameIndex = (expression: PortraitExpression): number =>
  PORTRAIT_EXPRESSIONS.indexOf(expression);

export const getPortraitTextureKey = (npcId: NpcId): string => `portrait:${npcId}`;
