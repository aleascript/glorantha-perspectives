import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(projectRoot, 'dist', 'publications');
const destination = path.join(projectRoot, 'build', 'downloads');

await fs.access(source);
await fs.rm(destination, {recursive: true, force: true});
await fs.mkdir(path.dirname(destination), {recursive: true});
await fs.cp(source, destination, {recursive: true});

console.log(`Publications copied to ${path.relative(projectRoot, destination)}/`);
