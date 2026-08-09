import { describe, expect, it } from 'vitest';
import { ATLAS_ASSET_MANIFEST } from '../data/assetManifest';
import {
  assertValidAssetManifest,
  validateAssetManifest
} from '../systems/AssetManifestValidator';

const cloneEntry = (index: number) => ({ ...ATLAS_ASSET_MANIFEST[index] });

describe('atlas asset manifest', () => {
  it('inventories all current character, portrait and fauna atlases', () => {
    expect(ATLAS_ASSET_MANIFEST).toHaveLength(25);
    expect(ATLAS_ASSET_MANIFEST.filter(({ family }) => family === 'character')).toHaveLength(12);
    expect(ATLAS_ASSET_MANIFEST.filter(({ family }) => family === 'portrait')).toHaveLength(10);
    expect(ATLAS_ASSET_MANIFEST.filter(({ family }) => family === 'fauna')).toHaveLength(3);
  });

  it('has unique ids, runtime keys and target PNG paths', () => {
    const result = validateAssetManifest(ATLAS_ASSET_MANIFEST);
    expect(result).toEqual({ valid: true, errors: [] });
    expect(() => assertValidAssetManifest(ATLAS_ASSET_MANIFEST)).not.toThrow();
  });

  it('reports exact duplicate and geometry diagnostics', () => {
    const first = cloneEntry(0);
    const duplicate = {
      ...cloneEntry(1),
      id: first.id,
      runtimeKey: first.runtimeKey,
      targetPath: first.targetPath,
      frameWidth: 0
    };

    const result = validateAssetManifest([first, duplicate]);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(`Duplicate asset id: ${first.id}`);
    expect(result.errors).toContain(`Duplicate runtime key: ${first.runtimeKey}`);
    expect(result.errors).toContain(`Duplicate target path: ${first.targetPath}`);
    expect(result.errors).toContain(`Invalid frame geometry: ${duplicate.id}`);
  });

  it('keeps the first checkpoint inventory-only', () => {
    expect(ATLAS_ASSET_MANIFEST.every(({ sourceKind }) => sourceKind === 'runtime-generated')).toBe(true);
  });
});
