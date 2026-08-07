import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('deterministic atlas PNG export', () => {
  it('renders every manifest atlas twice with byte-identical output', () => {
    const result = spawnSync(process.execPath, ['scripts/export-atlases.mjs', '--verify-only'], {
      cwd: process.cwd(),
      encoding: 'utf8'
    });

    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(result.stdout).toContain('Verified 25 deterministic atlas PNG exports.');
  }, 20_000);
});
