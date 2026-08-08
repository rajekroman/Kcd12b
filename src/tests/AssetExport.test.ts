import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('deterministic atlas PNG export', () => {
  it('matches every committed atlas byte-for-byte with deterministic output', () => {
    const result = spawnSync(
      process.execPath,
      ['scripts/export-atlases.mjs', '--verify-only', '--emit-base64'],
      {
        cwd: process.cwd(),
        encoding: 'utf8'
      }
    );

    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(result.stdout).toContain('Verified 25 deterministic atlas PNG exports.');

    const mismatches: string[] = [];
    for (const line of result.stdout.split('\n')) {
      if (!line.startsWith('ATLAS_BASE64\t')) continue;
      const [, path, base64] = line.split('\t');
      const expected = Buffer.from(base64, 'base64');
      const committed = readFileSync(path);
      if (!committed.equals(expected)) {
        mismatches.push(path);
        console.error(`EXPECTED_BASE64\t${path}\t${base64}`);
      }
    }

    expect(mismatches, `Committed PNG mismatches: ${mismatches.join(', ')}`).toEqual([]);
  }, 30_000);
});
