import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const narrativeSlugs = new Map([
  ['la-voie-lunaire', 'the-lunar-way'],
  ['le-bannissement-de-gurdtar', 'gurdtars-banishment'],
  ['les-heritiers-de-zola-fel', 'heirs-of-zola-fel'],
]);

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir) {
  const result = [];
  for (const entry of await fs.readdir(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await walk(full));
    else result.push(full);
  }
  return result;
}

function legacyTarget(locale, source) {
  const rel = path.relative(path.join(root, 'content', locale), source).split(path.sep).join('/');
  if (rel === 'index.md') return `docs/${locale}/index.md`;
  if (rel.startsWith('notes/')) return `docs/${locale}/${rel}`;
  if (rel.startsWith('rules/')) return `docs/${locale}/${rel}`;
  if (rel.startsWith('stories/')) {
    const parts = rel.split('/');
    parts[0] = 'narratives';
    if (parts[1] && narrativeSlugs.has(parts[1])) parts[1] = narrativeSlugs.get(parts[1]);
    return `docs/${locale}/${parts.join('/')}`;
  }
  return null;
}

const missing = [];
for (const locale of ['fr', 'en']) {
  const legacyRoot = path.join(root, 'content', locale);
  if (!(await exists(legacyRoot))) continue;

  for (const source of await walk(legacyRoot)) {
    if (!source.endsWith('.md')) continue;
    const target = legacyTarget(locale, source);
    if (!target) continue;
    if (!(await exists(path.join(root, target)))) {
      missing.push(`${path.relative(root, source)} -> ${target}`);
    }
  }
}

const badAssetRefs = [];
const missingImages = [];
for (const locale of ['fr', 'en']) {
  const docsRoot = path.join(root, 'docs', locale);
  if (!(await exists(docsRoot))) continue;
  for (const source of await walk(docsRoot)) {
    if (!/\.mdx?$/.test(source)) continue;
    const text = await fs.readFile(source, 'utf8');
    if (/\/(?:static\/)?assets\//.test(text) || /content\/assets/.test(text)) {
      badAssetRefs.push(path.relative(root, source));
    }
    for (const match of text.matchAll(/(?:src=["']|\()(?<url>\/img\/[^"')\s>]+)/g)) {
      const target = path.join(root, 'static', match.groups.url.replace(/^\//, ''));
      if (!(await exists(target))) missingImages.push(`${path.relative(root, source)} -> ${match.groups.url}`);
    }
  }
}

if (missing.length) {
  console.error('\nLegacy pages without a docs target:');
  for (const item of missing) console.error(`- ${item}`);
}
if (badAssetRefs.length) {
  console.error('\nDocs still referencing legacy assets:');
  for (const item of badAssetRefs) console.error(`- ${item}`);
}
if (missingImages.length) {
  console.error('\nMissing static/img targets:');
  for (const item of missingImages) console.error(`- ${item}`);
}

if (missing.length || badAssetRefs.length || missingImages.length) process.exit(1);
console.log('Legacy Markdown pages all have docs targets.');
console.log('Documentation uses canonical /img paths and all referenced images exist.');
