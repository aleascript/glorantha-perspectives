import {spawnSync} from 'node:child_process';
import fs from 'node:fs/promises';
import config from '../publications.config.mjs';

if (process.argv.length > 2) {
  throw new Error(
    'release:prepare no longer accepts a global version. Set each publication version in publications.config.mjs.',
  );
}

function run(command, args) {
  const result = spawnSync(command, args, {
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

const versions = Object.fromEntries(
  Object.entries(config.publications).map(([id, publication]) => [
    id,
    publication.version,
  ]),
);

await fs.writeFile(
  '.release-prepared',
  `${JSON.stringify({publications: versions}, null, 2)}\n`,
  'utf8',
);
console.log('Prepared publications from publications.config.mjs.');
