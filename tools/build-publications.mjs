import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from '@vivliostyle/cli';
import config from '../publications.config.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workRoot = path.join(projectRoot, '.publication-workspace');
const outputRoot = path.join(projectRoot, 'dist', 'publications');
const knownDocsByLocale = new Map();

function isPublicationDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
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

function normalizeRepoPath(value) {
  return value.split(path.sep).join('/');
}

function tocDocumentBlueprint(localeConfig) {
  const toc = localeConfig.toc ?? {};
  const documentTree = toc.documents ?? localeConfig.contents;
  const documentDepth = Number.isInteger(toc.documentDepth)
    ? toc.documentDepth
    : Number.POSITIVE_INFINITY;
  const indexByPath = new Map(
    localeConfig.contents.map((sourcePath, index) => [
      normalizeRepoPath(sourcePath),
      index,
    ]),
  );
  const seenIndexes = new Set();
  let skippedFirstDocument = false;

  function visit(nodes, depth) {
    const result = [];

    for (const rawNode of nodes ?? []) {
      const node = typeof rawNode === 'string' ? {path: rawNode} : rawNode;
      if (!node || typeof node !== 'object') {
        throw new Error('Publication ToC nodes must be document paths or objects.');
      }

      const children = visit(node.children ?? [], depth + 1);
      if (node.path) {
        const normalizedPath = normalizeRepoPath(node.path);
        const index = indexByPath.get(normalizedPath);
        if (index === undefined) {
          throw new Error(
            `Publication ToC references a document that is not in contents: ${normalizedPath}`,
          );
        }
        if (seenIndexes.has(index)) {
          throw new Error(`Publication ToC references a document twice: ${normalizedPath}`);
        }
        seenIndexes.add(index);

        if (toc.skipFirstDocument === true && !skippedFirstDocument) {
          skippedFirstDocument = true;
          result.push(...children);
          continue;
        }

        if (depth <= documentDepth) {
          result.push({type: 'document', index, children});
        }
        continue;
      }

      const label = typeof node.label === 'string' ? node.label.trim() : '';
      if (!label) {
        throw new Error('Publication ToC group nodes must define a non-empty label.');
      }
      if (depth <= documentDepth && children.length > 0) {
        result.push({type: 'group', label, children});
      }
    }

    return result;
  }

  const blueprint = visit(documentTree, 1);
  if (seenIndexes.size !== localeConfig.contents.length) {
    const missing = localeConfig.contents.filter(
      (_sourcePath, index) => !seenIndexes.has(index),
    );
    throw new Error(
      `Publication ToC is missing documents from contents: ${missing.join(', ')}`,
    );
  }

  return blueprint;
}

function vivliostyleConfigSource(task, tocBlueprint) {
  return `const task = ${JSON.stringify(task, null, 2)};
const tocBlueprint = ${JSON.stringify(tocBlueprint, null, 2)};

function renderTocList(nodes, nodeList, propsList) {
  return {
    type: 'element',
    tagName: 'ol',
    properties: {},
    children: nodes.flatMap((node) => {
      if (node.type === 'group') {
        return [{
          type: 'element',
          tagName: 'li',
          properties: {className: ['publication-toc-group']},
          children: [
            {
              type: 'element',
              tagName: 'span',
              properties: {className: ['publication-toc-group-label']},
              children: [{type: 'text', value: node.label}],
            },
            renderTocList(node.children ?? [], nodeList, propsList),
          ],
        }];
      }

      const document = nodeList[node.index];
      if (!document) {
        throw new Error(\`Publication ToC cannot resolve document index \${node.index}.\`);
      }
      const sectionChildren = [propsList[node.index]?.children]
        .flat()
        .filter(Boolean);
      const nestedDocuments = node.children?.length
        ? [renderTocList(node.children, nodeList, propsList)]
        : [];

      return [{
        type: 'element',
        tagName: 'li',
        properties: {},
        children: [
          {
            type: 'element',
            tagName: 'a',
            properties: {href: document.href},
            children: [{type: 'text', value: document.title}],
          },
          ...sectionChildren,
          ...nestedDocuments,
        ],
      }];
    }),
  };
}

task.toc.transformDocumentList = (nodeList) => (propsList) =>
  renderTocList(tocBlueprint, nodeList, propsList);

module.exports = task;
`;
}

function splitHref(href) {
  const match = href.match(/^([^?#]*)([?#][\s\S]*)?$/);
  return match
    ? {pathname: match[1], suffix: match[2] ?? ''}
    : {pathname: href, suffix: ''};
}

function hasExternalScheme(href) {
  return /^[A-Za-z][A-Za-z0-9+.-]*:/.test(href) || href.startsWith('//');
}

async function collectMarkdownDocs(locale) {
  if (knownDocsByLocale.has(locale)) return knownDocsByLocale.get(locale);

  const localeRoot = path.join(projectRoot, 'docs', locale);
  const docs = new Set();

  async function walk(directory) {
    for (const entry of await fs.readdir(directory, {withFileTypes: true})) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(absolute);
      } else if (/\.mdx?$/.test(entry.name)) {
        docs.add(normalizeRepoPath(path.relative(projectRoot, absolute)));
      }
    }
  }

  await walk(localeRoot);
  knownDocsByLocale.set(locale, docs);
  return docs;
}

function canonicalDocTarget(href, sourcePath, locale, knownDocs) {
  if (!href || href.startsWith('#') || hasExternalScheme(href)) return null;

  const {pathname: rawPath, suffix} = splitHref(href);
  if (!rawPath) return null;

  let decodedPath = rawPath;
  try {
    decodedPath = decodeURIComponent(rawPath);
  } catch {
    // Keep malformed percent-encoding untouched; Docusaurus will report it separately.
  }

  const localeRoot = `docs/${locale}`;
  const base = decodedPath.startsWith('/')
    ? localeRoot
    : path.posix.dirname(sourcePath);
  const relativeTarget = decodedPath.startsWith('/')
    ? decodedPath.replace(/^\/+/, '')
    : decodedPath;
  const resolved = path.posix.normalize(path.posix.join(base, relativeTarget));
  const stem = resolved.replace(/\/+$/, '');
  const extension = path.posix.extname(stem);
  const candidates = [];

  if (extension === '.md' || extension === '.mdx') {
    candidates.push(stem);
  } else if (!extension) {
    if (decodedPath.endsWith('/') || decodedPath === '.' || decodedPath === '..') {
      candidates.push(path.posix.join(stem, 'index.md'));
      candidates.push(`${stem}.md`);
    } else {
      candidates.push(`${stem}.md`);
      candidates.push(path.posix.join(stem, 'index.md'));
    }
  }

  const target = candidates.find((candidate) => knownDocs.has(candidate));
  return target ? {target, suffix} : null;
}

function siteHrefForDoc(target, suffix, locale) {
  const site = config.site ?? {};
  const publicUrl = site.publicUrl?.replace(/\/+$/, '');
  if (!publicUrl) {
    throw new Error('publications.config.mjs must define site.publicUrl');
  }

  const localeRoot = `docs/${locale}`;
  let route = path.posix.relative(localeRoot, target);
  if (route === 'index.md' || route === 'index.mdx') {
    route = '';
  } else if (/\/index\.mdx?$/.test(route)) {
    route = route.replace(/index\.mdx?$/, '');
  } else {
    route = `${route.replace(/\.mdx?$/, '')}/`;
  }

  const defaultLocale = site.defaultLocale ?? 'fr';
  const localePrefix = locale === defaultLocale ? '' : `${locale}/`;
  return `${new URL(`${localePrefix}${route}`, `${publicUrl}/`).href}${suffix}`;
}

function rewritePublicationHref(
  href,
  sourcePath,
  locale,
  publicationDocs,
  knownDocs,
  stats,
) {
  const resolved = canonicalDocTarget(href, sourcePath, locale, knownDocs);
  if (!resolved) return href;

  const {target, suffix} = resolved;
  if (!publicationDocs.has(target)) {
    const rewritten = siteHrefForDoc(target, suffix, locale);
    if (rewritten !== href) stats.site += 1;
    return rewritten;
  }

  if (target === sourcePath && suffix.startsWith('#')) {
    if (suffix !== href) stats.internal += 1;
    return suffix;
  }

  let relative = path.posix.relative(path.posix.dirname(sourcePath), target);
  if (!relative.startsWith('.')) relative = `./${relative}`;
  const rewritten = `${relative}${suffix}`;
  if (rewritten !== href) stats.internal += 1;
  return rewritten;
}

function transformOutsideInlineCode(line, transform) {
  let output = '';
  let cursor = 0;
  let delimiterLength = null;

  while (cursor < line.length) {
    const match = /`+/.exec(line.slice(cursor));
    if (!match) {
      const remainder = line.slice(cursor);
      output += delimiterLength === null ? transform(remainder) : remainder;
      break;
    }

    const markerStart = cursor + match.index;
    const before = line.slice(cursor, markerStart);
    output += delimiterLength === null ? transform(before) : before;

    const marker = match[0];
    output += marker;
    if (delimiterLength === null) delimiterLength = marker.length;
    else if (marker.length === delimiterLength) delimiterLength = null;
    cursor = markerStart + marker.length;
  }

  return output;
}

function rewritePublicationLinks(
  markdown,
  sourcePath,
  locale,
  publicationDocs,
  knownDocs,
  stats,
) {
  const lines = markdown.split(/\r?\n/);
  let fenceMarker = null;

  const rewrite = (href) =>
    rewritePublicationHref(
      href,
      sourcePath,
      locale,
      publicationDocs,
      knownDocs,
      stats,
    );

  function rewriteSegment(segment) {
    let rewritten = segment.replace(
      /(?<!!)(\[[^\]\n]+\]\()(<[^>]+>|[^)\s]+)([^)]*\))/g,
      (_match, opening, rawHref, closing) => {
        const wrapped = rawHref.startsWith('<') && rawHref.endsWith('>');
        const href = wrapped ? rawHref.slice(1, -1) : rawHref;
        const result = rewrite(href);
        return `${opening}${wrapped ? `<${result}>` : result}${closing}`;
      },
    );

    rewritten = rewritten.replace(
      /^(\s{0,3}\[[^\]\n]+\]:\s*)(<[^>]+>|\S+)(.*)$/,
      (_match, opening, rawHref, closing) => {
        const wrapped = rawHref.startsWith('<') && rawHref.endsWith('>');
        const href = wrapped ? rawHref.slice(1, -1) : rawHref;
        const result = rewrite(href);
        return `${opening}${wrapped ? `<${result}>` : result}${closing}`;
      },
    );

    return rewritten.replace(
      /(<a\b[^>]*\bhref=["'])([^"']+)(["'])/gi,
      (_match, opening, href, closing) => `${opening}${rewrite(href)}${closing}`,
    );
  }

  return lines
    .map((line) => {
      const fence = line.match(/^\s*(```+|~~~+)/);
      if (fence) {
        if (!fenceMarker) fenceMarker = fence[1][0];
        else if (fence[1][0] === fenceMarker) fenceMarker = null;
        return line;
      }
      if (fenceMarker) return line;
      return transformOutsideInlineCode(line, rewriteSegment);
    })
    .join('\n');
}

function adaptPublicationMarkdown(
  markdown,
  locale,
  sourcePath,
  publicationDocs,
  knownDocs,
  linkStats,
) {
  const diceAlt = locale === 'fr' ? 'Dé' : 'Dice';
  const diceImage = `![${diceAlt}](/img/publication/dice.svg)`;

  // Keep the canonical source friendly to the web, but adapt links and glyphs
  // for the multi-file publication assembled by Vivliostyle.
  const withHeading = ensureDocumentTitleHeading(markdown).replaceAll('🎲', diceImage);
  return rewritePublicationLinks(
    withHeading,
    sourcePath,
    locale,
    publicationDocs,
    knownDocs,
    linkStats,
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function publicationStatus(publicationName, publication) {
  const status = publication.status?.trim();
  if (!status) {
    throw new Error(
      `Publication "${publicationName}" must define a non-empty status.`,
    );
  }
  return status;
}

function publicationVersion(publicationName, publication) {
  const version =
    typeof publication.version === 'string' ? publication.version.trim() : '';
  if (!isPublicationDate(version)) {
    throw new Error(
      `Publication "${publicationName}" must define version as YYYY-MM-DD.`,
    );
  }
  return version;
}

function publicationVersionPolicy(publicationName, publication) {
  const policy = publication.versionPolicy ?? 'current';
  if (policy !== 'current' && policy !== 'fixed') {
    throw new Error(
      `Publication "${publicationName}" versionPolicy must be "current" or "fixed".`,
    );
  }
  return policy;
}

function publicationCoverMarkdown(
  publication,
  locale,
  localeConfig,
  version,
  status,
) {
  const cover = localeConfig.cover;
  if (!cover) return null;

  const labels =
    locale === 'fr'
      ? {date: 'Date de publication', status: 'Statut'}
      : {date: 'Publication date', status: 'Status'};
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
    <div class="publication-cover__footer">
      ${author}
      <dl class="publication-cover__metadata">
        <div class="publication-cover__metadata-field">
          <dt>${labels.date}</dt>
          <dd><time datetime="${escapeHtml(version)}">${escapeHtml(version)}</time></dd>
        </div>
        <div class="publication-cover__metadata-field">
          <dt>${labels.status}</dt>
          <dd>${escapeHtml(status)}</dd>
        </div>
      </dl>
    </div>
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
  list-style: none;
}

nav[role='doc-toc'] > ol {
  padding-inline-start: 0;
}

nav[role='doc-toc'] ol ol {
  padding-inline-start: 1.35em;
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

async function preparePublication(
  publicationName,
  publication,
  locale,
  localeConfig,
  version,
) {
  const publicationWorkDir = path.join(workRoot, publicationName, locale);
  await fs.rm(publicationWorkDir, {recursive: true, force: true});
  await fs.mkdir(publicationWorkDir, {recursive: true});

  const status = publicationStatus(publicationName, publication);
  let coverEntry = null;
  const coverMarkdown = publicationCoverMarkdown(
    publication,
    locale,
    localeConfig,
    version,
    status,
  );
  if (coverMarkdown) {
    coverEntry = 'publication-cover.md';
    await fs.writeFile(
      path.join(publicationWorkDir, coverEntry),
      coverMarkdown,
      'utf8',
    );
  }

  const knownDocs = await collectMarkdownDocs(locale);
  const publicationDocs = new Set(localeConfig.contents.map(normalizeRepoPath));
  const linkStats = {internal: 0, site: 0};
  const entries = [];
  for (const sourcePath of localeConfig.contents) {
    const normalizedSourcePath = normalizeRepoPath(sourcePath);
    const sourceAbsolute = path.join(projectRoot, sourcePath);
    const destinationAbsolute = path.join(publicationWorkDir, sourcePath);
    const markdown = adaptPublicationMarkdown(
      await fs.readFile(sourceAbsolute, 'utf8'),
      locale,
      normalizedSourcePath,
      publicationDocs,
      knownDocs,
      linkStats,
    );

    await fs.mkdir(path.dirname(destinationAbsolute), {recursive: true});
    await fs.writeFile(destinationAbsolute, markdown, 'utf8');
    entries.push(sourcePath);
  }

  console.log(
    `  Links: ${linkStats.internal} internalized, ${linkStats.site} redirected to site`,
  );

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
      ...(coverEntry ? [coverEntry] : []),
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

  const tocBlueprint = tocDocumentBlueprint(localeConfig);
  const configPath = path.join(publicationWorkDir, 'vivliostyle.config.js');
  await fs.writeFile(
    configPath,
    vivliostyleConfigSource(task, tocBlueprint),
    'utf8',
  );
  return configPath;
}

function publicationManifest() {
  return {
    publications: Object.entries(config.publications).map(([id, publication]) => ({
      id,
      outputName: publication.outputName ?? id,
      version: publicationVersion(id, publication),
      versionPolicy: publicationVersionPolicy(id, publication),
      status: publicationStatus(id, publication),
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

  console.log('Building publication corpus...');

  for (const [publicationName, publication] of Object.entries(config.publications)) {
    const version = publicationVersion(publicationName, publication);
    publicationVersionPolicy(publicationName, publication);
    for (const [locale, localeConfig] of Object.entries(publication.locales)) {
      console.log(`Building ${publicationName} ${version} (${locale})...`);
      const configPath = await preparePublication(
        publicationName,
        publication,
        locale,
        localeConfig,
        version,
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
    `${JSON.stringify(publicationManifest(), null, 2)}\n`,
    'utf8',
  );

  console.log(`Publications written to ${path.relative(projectRoot, outputRoot)}/`);
}

await main();