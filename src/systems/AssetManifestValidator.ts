import type { AtlasAssetManifestEntry } from '../data/assetManifest';

export interface AssetManifestValidationResult {
  valid: boolean;
  errors: readonly string[];
}

export const validateAssetManifest = (
  entries: readonly AtlasAssetManifestEntry[]
): AssetManifestValidationResult => {
  const errors: string[] = [];
  const ids = new Set<string>();
  const runtimeKeys = new Set<string>();
  const targetPaths = new Set<string>();
  const loadPaths = new Set<string>();

  for (const entry of entries) {
    if (ids.has(entry.id)) errors.push(`Duplicate asset id: ${entry.id}`);
    if (runtimeKeys.has(entry.runtimeKey)) {
      errors.push(`Duplicate runtime key: ${entry.runtimeKey}`);
    }
    if (targetPaths.has(entry.targetPath)) {
      errors.push(`Duplicate target path: ${entry.targetPath}`);
    }
    if (loadPaths.has(entry.loadPath)) {
      errors.push(`Duplicate load path: ${entry.loadPath}`);
    }

    ids.add(entry.id);
    runtimeKeys.add(entry.runtimeKey);
    targetPaths.add(entry.targetPath);
    loadPaths.add(entry.loadPath);

    if (!/^atlas\.(character|portrait|fauna)\.[a-z0-9-]+$/.test(entry.id)) {
      errors.push(`Invalid asset id: ${entry.id}`);
    }
    if (!entry.targetPath.endsWith('.png')) {
      errors.push(`Atlas target must be PNG: ${entry.id}`);
    }
    if (entry.sourceKind !== 'static-file') {
      errors.push(`Atlas runtime source must be static: ${entry.id}`);
    }
    if (!entry.loadPath.startsWith('assets/atlases/') || !entry.loadPath.endsWith('.png')) {
      errors.push(`Invalid atlas load path: ${entry.id}`);
    }
    if (entry.targetPath !== `public/${entry.loadPath}`) {
      errors.push(`Atlas target/load path mismatch: ${entry.id}`);
    }
    if (entry.frameWidth <= 0 || entry.frameHeight <= 0 || entry.frameCount <= 0) {
      errors.push(`Invalid frame geometry: ${entry.id}`);
    }
    if (entry.states.length !== entry.frameCount) {
      errors.push(`Frame state count mismatch: ${entry.id}`);
    }
    if (new Set(entry.states).size !== entry.states.length) {
      errors.push(`Duplicate frame state: ${entry.id}`);
    }
    if (entry.pixelDensity !== 1) {
      errors.push(`Unsupported pixel density: ${entry.id}`);
    }
  }

  return { valid: errors.length === 0, errors };
};

export const assertValidAssetManifest = (
  entries: readonly AtlasAssetManifestEntry[]
): void => {
  const result = validateAssetManifest(entries);
  if (!result.valid) {
    throw new Error(`Asset manifest validation failed:\n${result.errors.join('\n')}`);
  }
};
