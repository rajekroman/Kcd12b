import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('deterministic atlas PNG export', () => {
  it('renders all manifest atlases twice with byte-identical output', () => {
    const result = spawnSync(
      process.execPath,
      ['scripts/export-atlases.mjs', '--artifact-dir=test-results/asset-export'],
      {
        cwd: process.cwd(),
        encoding: 'utf8'
      }
    );

    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(result.stdout).toContain('Verified 25 deterministic atlas PNG exports.');
  }, 30_000);
});
