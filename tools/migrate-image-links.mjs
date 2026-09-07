import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsRoot = path.join(projectRoot, 'docs');
const staticRoot = path.join(projectRoot, 'static');

const replacements = new Map([
  ['rules/runes/autres/sartar.png', '/img/runes/sartar.png'],
  ['rules/runes/autres/war.png', '/img/runes/war.png'],
  ['rules/runes/conditions/bataille eternelle.png', '/img/runes/eternal-battle.png'],
  ['rules/runes/conditions/chance.png', '/img/runes/luck.png'],
  ['rules/runes/conditions/chaos.png', '/img/runes/chaos.png'],
  ['rules/runes/conditions/destin.png', '/img/runes/fate.png'],
  ['rules/runes/conditions/echanges.png', '/img/runes/exchange.png'],
  ['rules/runes/conditions/infini-coordinates.png', '/img/runes/infinity-coordinates.png'],
  ['rules/runes/conditions/infini.png', '/img/runes/infinity.png'],
  ['rules/runes/conditions/maitrise.png', '/img/runes/mastery.png'],
  ['rules/runes/elements/air.png', '/img/runes/air.png'],
  ['rules/runes/elements/eau.png', '/img/runes/water.png'],
  ['rules/runes/elements/feu.png', '/img/runes/fire.png'],
  ['rules/runes/elements/lune.png', '/img/runes/moon.png'],
  ['rules/runes/elements/obscurité.png', '/img/runes/darkness.png'],
  ['rules/runes/elements/terre.png', '/img/runes/earth.png'],
  ['rules/runes/formes/bête.png', '/img/runes/beast.png'],
  ['rules/runes/formes/dragon.png', '/img/runes/dragon.png'],
  ['rules/runes/formes/dragonewt.png', '/img/runes/dragonewt.png'],
  ['rules/runes/formes/esprit.png', '/img/runes/spirit.png'],
  ['rules/runes/formes/homme.png', '/img/runes/human.png'],
  ['rules/runes/formes/loi.png', '/img/runes/law.png'],
  ['rules/runes/formes/magie.png', '/img/runes/magic.png'],
  ['rules/runes/formes/plante.png', '/img/runes/plant.png'],
  ['rules/runes/mondes/gods.png', '/img/runes/gods.png'],
  ['rules/runes/mondes/logic.png', '/img/runes/logic.png'],
  ['rules/runes/mondes/median.png', '/img/runes/middle-world.png'],
  ['rules/runes/mondes/spirits.png', '/img/runes/spirits.png'],
  ['rules/runes/mondes/void.png', '/img/runes/void.png'],
  ['rules/runes/pouvoirs/desordre.png', '/img/runes/disorder.png'],
  ['rules/runes/pouvoirs/harmonie.png', '/img/runes/harmony.png'],
  ['rules/runes/pouvoirs/illusion.png', '/img/runes/illusion.png'],
  ['rules/runes/pouvoirs/mort.png', '/img/runes/death.png'],
  ['rules/runes/pouvoirs/mouvement.png', '/img/runes/movement.png'],
  ['rules/runes/pouvoirs/power-runes-circle.png', '/img/site/power-runes-circle.png'],
  ['rules/runes/pouvoirs/stase.png', '/img/runes/stasis.png'],
  ['rules/runes/pouvoirs/vie.png', '/img/runes/life.png'],
  ['rules/runes/pouvoirs/vérité.png', '/img/runes/truth.png'],
  ['rules/cards.png', '/img/rules/runic-cards.png'],
  ['rules/draconic_dices.png', '/img/rules/draconic-dice.png'],
  ['rules/marbles.png', '/img/rules/mystical-marbles.png'],
  ['rules/mysticism.png', '/img/rules/mystical-marbles.png'],
  ['srd/duckita.jpg', '/img/narratives/heirs-of-zola-fel/heroes/duckita.jpg'],
  ['srd/fazia.jpg', '/img/narratives/heirs-of-zola-fel/heroes/fazia.jpg'],
  ['srd/irinus.jpg', '/img/narratives/heirs-of-zola-fel/heroes/irinus.jpg'],
  ['srd/korlanth.jpg', '/img/narratives/heirs-of-zola-fel/heroes/korlanth.jpg'],
]);

const narrativePrefixes = [
  ['stories/la-voie-lunaire/', '/img/narratives/the-lunar-way/'],
  ['stories/les-heritiers-de-zola-fel/', '/img/narratives/heirs-of-zola-fel/'],
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function walk(dir) {
  const entries = await fs.readdir(dir, {withFileTypes: true});
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolute)));
    else if (/\.(md|mdx)$/i.test(entry.name)) files.push(absolute);
  }
  return files;
}

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

function rewriteDirectLinks(markdown) {
  let rewritten = markdown;
  for (const [legacyPath, canonicalPath] of replacements) {
    const relative = new RegExp(
      `(?:\\.\\.\\/)+assets\\/${escapeRegex(legacyPath)}`,
      'g',
    );
    rewritten = rewritten.replace(relative, canonicalPath);
    rewritten = rewritten.replaceAll(`/assets/${legacyPath}`, canonicalPath);
  }
  return rewritten;
}

function rewriteNarrativeLinks(markdown) {
  let rewritten = markdown;
  for (const [legacyPrefix, canonicalPrefix] of narrativePrefixes) {
    const relative = new RegExp(
      `(?:\\.\\.\\/)+assets\\/${escapeRegex(legacyPrefix)}([^\\s)"'>]+)`,
      'g',
    );
    rewritten = rewritten.replace(relative, `${canonicalPrefix}$1`);
    const absolute = new RegExp(
      `/assets/${escapeRegex(legacyPrefix)}([^\\s)"'>]+)`,
      'g',
    );
    rewritten = rewritten.replace(absolute, `${canonicalPrefix}$1`);
  }
  return rewritten;
}

const files = await walk(docsRoot);
let changedFiles = 0;
const unresolvedLegacy = [];
const missingCanonical = [];

for (const file of files) {
  const original = await fs.readFile(file, 'utf8');
  let rewritten = rewriteDirectLinks(original);
  rewritten = rewriteNarrativeLinks(rewritten);

  if (rewritten !== original) {
    await fs.writeFile(file, rewritten, 'utf8');
    changedFiles += 1;
  }

  const remaining = [
    ...rewritten.matchAll(/(?:\.\.\/)+assets\/([^\n)"'>]+)|\/assets\/([^\n)"'>]+)/g),
  ];
  if (remaining.length) {
    unresolvedLegacy.push({
      file: path.relative(projectRoot, file),
      links: [...new Set(remaining.map((item) => item[1] ?? item[2]))],
    });
  }

  const canonicalLinks = [
    ...rewritten.matchAll(/\/img\/[^\s)"'>]+/g),
  ].map((item) => item[0]);
  for (const canonicalLink of new Set(canonicalLinks)) {
    const absolute = path.join(staticRoot, canonicalLink.replace(/^\//, ''));
    if (!(await exists(absolute))) {
      missingCanonical.push({
        file: path.relative(projectRoot, file),
        link: canonicalLink,
      });
    }
  }
}

console.log(`Rewritten ${changedFiles} Markdown/MDX files.`);

if (unresolvedLegacy.length) {
  console.error('Unresolved legacy asset links:');
  for (const item of unresolvedLegacy) {
    console.error(`- ${item.file}: ${item.links.join(', ')}`);
  }
}

if (missingCanonical.length) {
  console.error('Canonical /img links without a file in static/:');
  for (const item of missingCanonical) {
    console.error(`- ${item.file}: ${item.link}`);
  }
}

if (unresolvedLegacy.length || missingCanonical.length) {
  process.exitCode = 1;
} else {
  console.log('All documentation image links resolve through static/img/.');
}
