import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('deterministic atlas PNG export', () => {
  it('renders all manifest atlases twice with byte-identical output', () => {
    const result = spawnSync(
      process.execPath,
      ['scripts/export-atlases.mjs', '--verify-only', '--emit-base64', '--emit-report-base64'],
      {
        cwd: process.cwd(),
        encoding: 'utf8'
      }
    );

    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);

    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(result.stdout).toContain('Verified 25 deterministic atlas PNG exports.');
    expect((result.stdout.match(/^ATLAS_BASE64\t/gm) ?? []).length).toBe(25);
    expect(result.stdout).toContain('ATLAS_REPORT_BASE64\t');
  }, 30_000);
});
