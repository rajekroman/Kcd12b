import {
  ATLAS_ASSET_MANIFEST,
  type AtlasAssetManifestEntry
} from '../data/assetManifest';

interface AtlasSpriteSheetLoader {
  spritesheet(
    key: string,
    url: string,
    frameConfig: { frameWidth: number; frameHeight: number; endFrame: number }
  ): unknown;
}

interface AtlasTextureFrame {
  width: number;
  height: number;
}

interface AtlasTexture {
  getFrameNames(includeBase?: boolean): string[];
  get(name?: string | number): AtlasTextureFrame;
}

interface AtlasTextureManager {
  exists(key: string): boolean;
  get(key: string): AtlasTexture;
}

export const getAtlasEntryByRuntimeKey = (
  runtimeKey: string,
  entries: readonly AtlasAssetManifestEntry[] = ATLAS_ASSET_MANIFEST
): AtlasAssetManifestEntry | undefined =>
  entries.find((entry) => entry.runtimeKey === runtimeKey);

export const describeAtlasLoadFailure = (entry: AtlasAssetManifestEntry): string =>
  `Failed to preload atlas ${entry.id} (${entry.runtimeKey}) from ${entry.loadPath}.`;

export const queueStaticAtlasPreloads = (
  loader: AtlasSpriteSheetLoader,
  entries: readonly AtlasAssetManifestEntry[] = ATLAS_ASSET_MANIFEST
): void => {
  for (const entry of entries) {
    loader.spritesheet(entry.runtimeKey, entry.loadPath, {
      frameWidth: entry.frameWidth,
      frameHeight: entry.frameHeight,
      endFrame: entry.frameCount - 1
    });
  }
};

export const assertStaticAtlasTextures = (
  textures: AtlasTextureManager,
  entries: readonly AtlasAssetManifestEntry[] = ATLAS_ASSET_MANIFEST
): void => {
  for (const entry of entries) {
    if (!textures.exists(entry.runtimeKey)) {
      throw new Error(describeAtlasLoadFailure(entry));
    }

    const texture = textures.get(entry.runtimeKey);
    const frameNames = new Set(texture.getFrameNames(false));

    for (let index = 0; index < entry.frameCount; index += 1) {
      if (!frameNames.has(String(index))) {
        throw new Error(
          `Atlas frame contract failed for ${entry.id} (${entry.runtimeKey}): missing frame ${index}.`
        );
      }

      const frame = texture.get(index);
      if (frame.width !== entry.frameWidth || frame.height !== entry.frameHeight) {
        throw new Error(
          `Atlas frame contract failed for ${entry.id} (${entry.runtimeKey}) frame ${index}: ` +
            `expected ${entry.frameWidth}x${entry.frameHeight}, received ${frame.width}x${frame.height}.`
        );
      }
    }
  }
};
