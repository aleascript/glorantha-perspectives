import {spawnSync} from 'node:child_process';
import fs from 'node:fs/promises';

const version = process.argv[2]?.trim();

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version ?? '')) {
  throw new Error(`Invalid release version: ${version ?? '<missing>'}`);
}

const env = {...process.env, PUBLICATION_VERSION: version};

function run(command, args) {
  const result = spawnSync(command, args, {
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`);
  }
}

run('npm', ['run', 'publication:build']);
run('npm', ['run', 'build']);
run('npm', ['run', 'publication:site']);

await fs.writeFile('.release-prepared', `${version}\n`, 'utf8');
console.log(`Prepared release ${version}.`);
