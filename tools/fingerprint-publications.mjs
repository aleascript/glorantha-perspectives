import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import config from '../publications.config.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(projectRoot, 'dist', 'publications', 'publications.json');
const fingerprintSchema = 'publication-content-v1';

function normalizeRepoPath(value) {
  return value.split(path.sep).join('/');
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stableValue(value[key])]),
    );
  }
  return value;
}

function stableJson(value) {
  return JSON.stringify(stableValue(value));
}

function addText(hash, label, value) {
  hash.update(`${label}\0`, 'utf8');
  hash.update(value, 'utf8');
  hash.update('\0', 'utf8');
}

async function addFile(hash, repoPath) {
  const normalized = normalizeRepoPath(repoPath);
  const absolute = path.join(projectRoot, normalized);
  const content = await fs.readFile(absolute);
  addText(hash, 'file', normalized);
  hash.update(content);
  hash.update('\0', 'utf8');
}

function stripUrlSuffix(value) {
  return value.split(/[?#]/, 1)[0];
}

function isExternalReference(value) {
  return (
    !value ||
    value.startsWith('#') ||
    value.startsWith('data:') ||
    value.startsWith('//') ||
    /^[A-Za-z][A-Za-z0-9+.-]*:/.test(value)
  );
}

function resolveLocalAsset(reference, sourcePath = null) {
  if (isExternalReference(reference)) return null;

  let clean = stripUrlSuffix(reference.trim().replace(/^<|>$/g, ''));
  try {
    clean = decodeURIComponent(clean);
  } catch {
    // Keep malformed percent-encoding as-is; the publication build will report it.
  }
  if (!clean) return null;

  if (clean.startsWith('/')) {
    return normalizeRepoPath(path.posix.join('static', clean.replace(/^\/+/, '')));
  }

  if (!sourcePath) return normalizeRepoPath(clean);
  return normalizeRepoPath(path.posix.join(path.posix.dirname(sourcePath), clean));
}

function markdownAssetReferences(markdown, sourcePath) {
  const references = new Set();

  for (const match of markdown.matchAll(/!\[[^\]]*\]\((?:<([^>]+)>|([^\s)]+))/g)) {
    const resolved = resolveLocalAsset(match[1] ?? match[2], sourcePath);
    if (resolved) references.add(resolved);
  }

  for (const match of markdown.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)) {
    const resolved = resolveLocalAsset(match[1], sourcePath);
    if (resolved) references.add(resolved);
  }

  if (markdown.includes('🎲')) {
    references.add('static/img/publication/dice.svg');
  }

  return references;
}

function cssAssetReferences(css, themePath) {
  const references = new Set();
  for (const match of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
    const resolved = resolveLocalAsset(match[1], themePath);
    if (resolved) references.add(resolved);
  }
  return references;
}

async function publicationContentHash(publicationId, publication) {
  const hash = crypto.createHash('sha256');
  const {version: _version, ...contentConfig} = publication;
  const assetPaths = new Set();

  addText(hash, 'schema', fingerprintSchema);
  addText(hash, 'publication', publicationId);
  addText(hash, 'site-config', stableJson(config.site ?? {}));
  addText(hash, 'publication-config', stableJson(contentConfig));

  for (const locale of Object.keys(publication.locales).sort()) {
    const localeConfig = publication.locales[locale];
    for (const sourcePath of localeConfig.contents) {
      const normalizedSource = normalizeRepoPath(sourcePath);
      const markdown = await fs.readFile(path.join(projectRoot, normalizedSource), 'utf8');
      await addFile(hash, normalizedSource);
      for (const asset of markdownAssetReferences(markdown, normalizedSource)) {
        assetPaths.add(asset);
      }
    }

    const coverImage = localeConfig.cover?.image;
    if (coverImage) {
      const resolvedCover = resolveLocalAsset(coverImage);
      if (resolvedCover) assetPaths.add(resolvedCover);
    }
  }

  if (publication.theme) {
    const themePath = normalizeRepoPath(publication.theme);
    const theme = await fs.readFile(path.join(projectRoot, themePath), 'utf8');
    await addFile(hash, themePath);
    for (const asset of cssAssetReferences(theme, themePath)) {
      assetPaths.add(asset);
    }
  }

  for (const assetPath of [...assetPaths].sort()) {
    await addFile(hash, assetPath);
  }

  return hash.digest('hex');
}

const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
const configuredIds = new Set(Object.keys(config.publications));

for (const publication of manifest.publications) {
  if (!configuredIds.has(publication.id)) {
    throw new Error(`Publication "${publication.id}" is present in the manifest but not in publications.config.mjs.`);
  }
  publication.contentHash = await publicationContentHash(
    publication.id,
    config.publications[publication.id],
  );
  configuredIds.delete(publication.id);
  console.log(`Fingerprint ${publication.id}: ${publication.contentHash}`);
}

if (configuredIds.size > 0) {
  throw new Error(
    `Configured publications missing from the manifest: ${[...configuredIds].join(', ')}`,
  );
}

await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
