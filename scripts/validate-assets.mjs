import { spawnSync } from 'node:child_process';

const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.error) {
    console.error(`Unable to start asset validation: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
};

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
run(npm, ['exec', 'vitest', 'run', 'src/tests/AssetManifest.test.ts', 'src/tests/AssetExport.test.ts']);
run(process.execPath, ['scripts/export-atlases.mjs', '--verify-only']);

console.log('Asset manifest and deterministic PNG export validation passed.');
