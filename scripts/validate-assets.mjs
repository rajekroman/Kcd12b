import { spawnSync } from 'node:child_process';

const result = spawnSync(
  process.platform === 'win32' ? 'npm.cmd' : 'npm',
  ['exec', 'vitest', 'run', 'src/tests/AssetManifest.test.ts'],
  { stdio: 'inherit' }
);

if (result.error) {
  console.error(`Unable to start asset manifest validation: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
