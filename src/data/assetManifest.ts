import {
  CHARACTER_ATLAS_DEFINITIONS,
  CHARACTER_FRAME_HEIGHT,
  CHARACTER_FRAME_STATES,
  CHARACTER_FRAME_WIDTH
} from './characterAtlases';
import {
  PORTRAIT_DEFINITIONS,
  PORTRAIT_EXPRESSIONS,
  PORTRAIT_HEIGHT,
  PORTRAIT_WIDTH
} from './portraits';
import {
  ANIMAL_SPECIES,
  FAUNA_FRAME_HEIGHT,
  FAUNA_FRAME_STATES,
  FAUNA_FRAME_WIDTH
} from './fauna';

export type AssetFamily = 'character' | 'portrait' | 'fauna';
export type AssetSourceKind = 'runtime-generated' | 'static-file';

export interface AtlasAssetManifestEntry {
  id: string;
  family: AssetFamily;
  runtimeKey: string;
  sourceKind: AssetSourceKind;
  sourceModule: string;
  targetPath: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  states: readonly string[];
  pixelDensity: 1;
}

const characterEntries: readonly AtlasAssetManifestEntry[] = CHARACTER_ATLAS_DEFINITIONS.map(
  ({ key }) => ({
    id: `atlas.character.${key}`,
    family: 'character',
    runtimeKey: key,
    sourceKind: 'runtime-generated',
    sourceModule: 'src/systems/CharacterAtlasSystem.ts',
    targetPath: `public/assets/atlases/characters/${key}.png`,
    frameWidth: CHARACTER_FRAME_WIDTH,
    frameHeight: CHARACTER_FRAME_HEIGHT,
    frameCount: CHARACTER_FRAME_STATES.length,
    states: CHARACTER_FRAME_STATES,
    pixelDensity: 1
  })
);

const portraitEntries: readonly AtlasAssetManifestEntry[] = PORTRAIT_DEFINITIONS.map(
  ({ npcId }) => ({
    id: `atlas.portrait.${npcId}`,
    family: 'portrait',
    runtimeKey: `portrait:${npcId}`,
    sourceKind: 'runtime-generated',
    sourceModule: 'src/systems/PortraitSystem.ts',
    targetPath: `public/assets/atlases/portraits/${npcId}.png`,
    frameWidth: PORTRAIT_WIDTH,
    frameHeight: PORTRAIT_HEIGHT,
    frameCount: PORTRAIT_EXPRESSIONS.length,
    states: PORTRAIT_EXPRESSIONS,
    pixelDensity: 1
  })
);

const faunaEntries: readonly AtlasAssetManifestEntry[] = Object.keys(ANIMAL_SPECIES).map(
  (species) => ({
    id: `atlas.fauna.${species}`,
    family: 'fauna',
    runtimeKey: `fauna:${species}`,
    sourceKind: 'runtime-generated',
    sourceModule: 'src/systems/FaunaAtlasSystem.ts',
    targetPath: `public/assets/atlases/fauna/${species}.png`,
    frameWidth: FAUNA_FRAME_WIDTH,
    frameHeight: FAUNA_FRAME_HEIGHT,
    frameCount: FAUNA_FRAME_STATES.length,
    states: FAUNA_FRAME_STATES,
    pixelDensity: 1
  })
);

export const ATLAS_ASSET_MANIFEST: readonly AtlasAssetManifestEntry[] = [
  ...characterEntries,
  ...portraitEntries,
  ...faunaEntries
];
