import {execFileSync} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from '@vivliostyle/cli';
import config from '../publications.config.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workRoot = path.join(projectRoot, '.publication-workspace');
const outputRoot = path.join(projectRoot, 'dist', 'publications');

function resolvePublicationVersion() {
  const explicit = process.env.PUBLICATION_VERSION?.trim();
  if (explicit) return explicit;

  try {
    const tag = execFileSync(
      'git',
      ['describe', '--tags', '--abbrev=0', '--match', 'v[0-9]*'],
      {cwd: projectRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']},
    ).trim();
    if (/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(tag)) return tag.slice(1);
  } catch {
    // A working branch may not have a release tag yet.
  }

  return config.release?.initialVersion ?? '0.1.0';
}

function decodeFrontmatterScalar(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replaceAll("''", "'");
  }
  return trimmed;
}

function ensureDocumentTitleHeading(markdown) {
  if (/^#\s+\S/m.test(markdown)) return markdown;

  const frontmatter = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!frontmatter) return markdown;

  const titleLine = frontmatter[1]
    .split(/\r?\n/)
    .find((line) => /^title\s*:/.test(line));
  if (!titleLine) return markdown;

  const title = decodeFrontmatterScalar(titleLine.replace(/^title\s*:\s*/, ''));
  if (!title) return markdown;

  const insertionPoint = frontmatter[0].length;
  return `${markdown.slice(0, insertionPoint)}\n# ${title}\n${markdown.slice(insertionPoint)}`;
}

function adaptPublicationMarkdown(markdown, locale) {
  const diceAlt = locale === 'fr' ? 'Dé' : 'Dice';
  const diceImage = `![${diceAlt}](/img/publication/dice.svg)`;

  // Keep the canonical source friendly to the web, but replace emoji glyphs
  // that are not reliably available in PDF fonts with a vector publication asset.
  return ensureDocumentTitleHeading(markdown).replaceAll('🎲', diceImage);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function publicationCoverMarkdown(publication, localeConfig) {
  const cover = localeConfig.cover;
  if (!cover) return null;

  const seriesTitle = cover.seriesTitle
    ? `<p class="publication-cover__series">${escapeHtml(cover.seriesTitle)}</p>`
    : '';
  const author = publication.author
    ? `<p class="publication-cover__author">${escapeHtml(publication.author)}</p>`
    : '';

  return `<div class="publication-cover">
  <div class="publication-cover__visual">
    <img class="publication-cover__image" src="${escapeHtml(cover.image)}" alt="${escapeHtml(cover.alt ?? localeConfig.title)}" />
  </div>
  <div class="publication-cover__text">
    ${seriesTitle}
    <div class="publication-cover__title">${escapeHtml(localeConfig.title)}</div>
    ${author}
  </div>
</div>
`;
}

function publicationThemeOverrides(localeConfig) {
  const toc = localeConfig.toc ?? {};
  const rules = [];

  if (toc.numbered === false) {
    rules.push(`
nav[role='doc-toc'] ol {
  padding-inline-start: 0;
  list-style: none;
}
`);
  }

  if (toc.pageNumbers === false) {
    rules.push(`
nav[role='doc-toc'] a {
  display: block;
  width: auto;
}

nav[role='doc-toc'] a::before,
nav[role='doc-toc'] a::after {
  margin: 0;
  border: 0;
  content: none;
}
`);
  }

  return rules.join('');
}

function assetName(baseName, locale, format) {
  return `${baseName}-${locale}.${format}`;
}

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function preparePublication(publicationName, publication, locale, localeConfig) {
  const publicationWorkDir = path.join(workRoot, publicationName, locale);
  await fs.rm(publicationWorkDir, {recursive: true, force: true});
  await fs.mkdir(publicationWorkDir, {recursive: true});

  let coverEntry = null;
  const coverMarkdown = publicationCoverMarkdown(publication, localeConfig);
  if (coverMarkdown) {
    coverEntry = 'publication-cover.md';
    await fs.writeFile(
      path.join(publicationWorkDir, coverEntry),
      coverMarkdown,
      'utf8',
    );
  }

  const entries = [];
  for (const sourcePath of localeConfig.contents) {
    const sourceAbsolute = path.join(projectRoot, sourcePath);
    const destinationAbsolute = path.join(publicationWorkDir, sourcePath);
    const markdown = adaptPublicationMarkdown(
      await fs.readFile(sourceAbsolute, 'utf8'),
      locale,
    );

    await fs.mkdir(path.dirname(destinationAbsolute), {recursive: true});
    await fs.writeFile(destinationAbsolute, markdown, 'utf8');
    entries.push(sourcePath);
  }

  // Docusaurus exposes static/img at /img. Mirror that route explicitly in
  // Vivliostyle instead of changing the canonical Markdown asset URLs.
  const staticSource = path.join(projectRoot, 'static');
  const staticDestination = path.join(publicationWorkDir, 'static');
  const hasStatic = await pathExists(staticSource);
  if (hasStatic) {
    await fs.cp(staticSource, staticDestination, {recursive: true});
  }
  const staticImageDestination = path.join(staticDestination, 'img');
  const hasStaticImages = hasStatic && (await pathExists(staticImageDestination));

  const themeSource = path.join(projectRoot, publication.theme);
  const themeDestination = path.join(publicationWorkDir, 'theme.css');
  const theme = await fs.readFile(themeSource, 'utf8');
  await fs.writeFile(
    themeDestination,
    `${theme}${publicationThemeOverrides(localeConfig)}`,
    'utf8',
  );

  const output = localeConfig.outputs.map((format) => ({
    path: path.join(
      outputRoot,
      assetName(publication.outputName ?? publicationName, locale, format),
    ),
    format,
  }));

  const task = {
    title: localeConfig.title,
    author: publication.author,
    language: locale,
    size: publication.size ?? 'A4',
    entry: [
      ...(coverEntry ? [{path: coverEntry, rel: 'cover'}] : []),
      {rel: 'contents'},
      ...entries,
    ],
    entryContext: publicationWorkDir,
    theme: themeDestination,
    vfm: {rewriteRelativeHrefExtensions: true},
    toc: {
      title: localeConfig.tocTitle ?? (locale === 'fr' ? 'Sommaire' : 'Contents'),
      sectionDepth: localeConfig.toc?.sectionDepth ?? 2,
    },
    output,
    workspaceDir: '.vivliostyle',
    ...(hasStaticImages ? {static: {'/img': staticImageDestination}} : {}),
  };

  const configPath = path.join(publicationWorkDir, 'vivliostyle.config.json');
  await fs.writeFile(configPath, JSON.stringify(task, null, 2), 'utf8');
  return configPath;
}

function publicationManifest(version) {
  return {
    version,
    publications: Object.entries(config.publications).map(([id, publication]) => ({
      id,
      outputName: publication.outputName ?? id,
      revision: publication.revision ?? null,
      locales: Object.fromEntries(
        Object.entries(publication.locales).map(([locale, localeConfig]) => [
          locale,
          {
            title: localeConfig.title,
            formats: localeConfig.outputs.map((format) => ({
              format,
              path: assetName(publication.outputName ?? id, locale, format),
            })),
          },
        ]),
      ),
    })),
  };
}

async function main() {
  await fs.rm(workRoot, {recursive: true, force: true});
  await fs.rm(outputRoot, {recursive: true, force: true});
  await fs.mkdir(outputRoot, {recursive: true});

  const version = resolvePublicationVersion();
  console.log(`Building publication corpus version ${version}...`);

  for (const [publicationName, publication] of Object.entries(config.publications)) {
    for (const [locale, localeConfig] of Object.entries(publication.locales)) {
      console.log(`Building ${publicationName} (${locale})...`);
      const configPath = await preparePublication(
        publicationName,
        publication,
        locale,
        localeConfig,
      );
      await build({
        config: configPath,
        logLevel: 'info',
        enableStaticServe: true,
      });
    }
  }

  await fs.writeFile(
    path.join(outputRoot, 'publications.json'),
    `${JSON.stringify(publicationManifest(version), null, 2)}\n`,
    'utf8',
  );

  console.log(`Publications written to ${path.relative(projectRoot, outputRoot)}/`);
}

await main();
