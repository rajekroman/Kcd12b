import { describe, expect, it, vi } from 'vitest';
import { ATLAS_ASSET_MANIFEST } from '../data/assetManifest';
import {
  assertStaticAtlasTextures,
  describeAtlasLoadFailure,
  queueStaticAtlasPreloads
} from '../systems/AtlasRuntimeLoader';

describe('AtlasRuntimeLoader', () => {
  it('queues all 25 manifest atlases as bounded sprite sheets', () => {
    const spritesheet = vi.fn();

    queueStaticAtlasPreloads({ spritesheet });

    expect(spritesheet).toHaveBeenCalledTimes(25);
    const first = ATLAS_ASSET_MANIFEST[0];
    expect(spritesheet).toHaveBeenCalledWith(first.runtimeKey, first.loadPath, {
      frameWidth: first.frameWidth,
      frameHeight: first.frameHeight,
      endFrame: first.frameCount - 1
    });
  });

  it('accepts the exact manifest frame count and geometry', () => {
    const entry = ATLAS_ASSET_MANIFEST[0];
    const frameNames = Array.from({ length: entry.frameCount }, (_, index) => String(index));

    expect(() =>
      assertStaticAtlasTextures(
        {
          exists: () => true,
          get: () => ({
            getFrameNames: () => frameNames,
            get: () => ({ width: entry.frameWidth, height: entry.frameHeight })
          })
        },
        [entry]
      )
    ).not.toThrow();
  });

  it('fails a missing manifest asset with its stable id, runtime key and load path', () => {
    const entry = ATLAS_ASSET_MANIFEST[0];

    expect(() =>
      assertStaticAtlasTextures(
        {
          exists: () => false,
          get: vi.fn()
        },
        [entry]
      )
    ).toThrow(describeAtlasLoadFailure(entry));
  });

  it('fails changed static frame geometry before the game starts', () => {
    const entry = ATLAS_ASSET_MANIFEST[0];
    const frameNames = Array.from({ length: entry.frameCount }, (_, index) => String(index));

    expect(() =>
      assertStaticAtlasTextures(
        {
          exists: () => true,
          get: () => ({
            getFrameNames: () => frameNames,
            get: () => ({ width: entry.frameWidth + 1, height: entry.frameHeight })
          })
        },
        [entry]
      )
    ).toThrow(`Atlas frame contract failed for ${entry.id}`);
  });
});
