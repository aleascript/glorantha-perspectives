import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicationRoot = path.join(projectRoot, 'dist', 'publications');
const forbiddenPrefixes = [
  'http://localhost:',
  'https://localhost:',
  'http://127.0.0.1:',
  'https://127.0.0.1:',
];

async function pdfFiles(directory) {
  const entries = await fs.readdir(directory, {withFileTypes: true});
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.pdf'))
    .map((entry) => path.join(directory, entry.name));
}

const files = await pdfFiles(publicationRoot);
if (files.length === 0) {
  throw new Error(`No generated PDFs found in ${publicationRoot}`);
}

const failures = [];
for (const file of files) {
  const bytes = await fs.readFile(file);
  const raw = bytes.toString('latin1');
  const leaked = forbiddenPrefixes.filter((prefix) => raw.includes(prefix));
  if (leaked.length > 0) {
    failures.push({file: path.relative(projectRoot, file), leaked});
  }
}

if (failures.length > 0) {
  for (const {file, leaked} of failures) {
    console.error(`Publication PDF contains local build links: ${file}`);
    for (const prefix of leaked) console.error(`  ${prefix}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Checked ${files.length} publication PDFs: no localhost links.`);
}
