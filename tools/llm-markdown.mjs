// Builds the plain Markdown edition of a publication, meant for LLMs.
// Input chapters are expected to have gone through adaptPublicationMarkdown.

const runeNames = {
  fr: {
    air: 'Air', beast: 'Bête', chaos: 'Chaos', darkness: 'Obscurité', death: 'Mort',
    disorder: 'Désordre', dragonewt: 'Dragonewt', dragon: 'Dragon', earth: 'Terre',
    'eternal-battle': 'Bataille éternelle', exchange: 'Échange', fate: 'Destin',
    fire: 'Feu', gods: 'Dieux', harmony: 'Harmonie', human: 'Humain', illusion: 'Illusion',
    'infinity-coordinates': 'Coordonnées de l’Infini', infinity: 'Infini', law: 'Loi',
    life: 'Vie', logic: 'Logique', luck: 'Chance', magic: 'Magie', mastery: 'Maîtrise',
    'middle-world': 'Monde du Milieu', moon: 'Lune', movement: 'Mouvement', plant: 'Plante',
    sartar: 'Sartar', spirit: 'Esprit', spirits: 'Esprits', stasis: 'Stase', truth: 'Vérité',
    void: 'Vide', war: 'Guerre', water: 'Eau',
  },
  en: {
    'eternal-battle': 'Eternal Battle', 'infinity-coordinates': 'Infinity Coordinates',
    'middle-world': 'Middle World',
  },
};

const headerText = {
  fr: {
    version: 'Version',
    license: 'Licence : Creative Commons Attribution (CC BY). Auteur : AleaScript.',
    trademark:
      'Glorantha, ses marques et son univers appartiennent à Chaosium. Ce jeu est une œuvre de fan indépendante, non officielle.',
    instruction: 'Lis ce document en entier avant de mener une partie.',
    rune: 'Rune :',
  },
  en: {
    version: 'Version',
    license: 'License: Creative Commons Attribution (CC BY). Author: AleaScript.',
    trademark:
      'Glorantha, its trademarks and its setting belong to Chaosium. This game is an independent, unofficial fan work.',
    instruction: 'Read this whole document before running a game.',
    rune: 'Rune:',
  },
};

function runeName(file, alt, locale) {
  if (alt?.trim()) return alt.trim();
  const slug = file.replace(/\.[a-z]+$/i, '');
  const known = runeNames[locale]?.[slug];
  if (known) return known;
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Depth of each document in the ToC tree (group nodes count as a level).
export function documentDepths(tree) {
  const depths = new Map();
  (function visit(nodes, depth) {
    for (const node of nodes ?? []) {
      if (typeof node === 'string') depths.set(node, depth);
      else {
        if (node.path) depths.set(node.path, depth);
        visit(node.children, depth + 1);
      }
    }
  })(tree, 1);
  return depths;
}

function mapOutsideFences(markdown, transformLines) {
  const lines = markdown.split('\n');
  const output = [];
  let fence = null;
  let chunk = [];
  const flush = () => {
    output.push(...transformLines(chunk));
    chunk = [];
  };
  for (const line of lines) {
    const match = line.match(/^\s*(```+|~~~+)/);
    if (match && (!fence || match[1][0] === fence)) {
      if (!fence) {
        flush();
        fence = match[1][0];
      } else fence = null;
      output.push(line);
    } else if (fence) output.push(line);
    else chunk.push(line);
  }
  flush();
  return output.join('\n');
}

function stripDecorativeBlocks(lines) {
  const output = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (/^\s*<div\b/.test(lines[i])) {
      while (i < lines.length && !/<\/div>\s*$/.test(lines[i])) i += 1;
      continue;
    }
    output.push(lines[i]);
  }
  return output;
}

export function cleanChapter(markdown, {locale, publicUrl, headingShift}) {
  const base = publicUrl.replace(/\/+$/, '');
  const rune = headerText[locale].rune;
  let text = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '').replace(/\r\n/g, '\n');

  text = mapOutsideFences(text, (lines) => {
    const kept = stripDecorativeBlocks(lines).map((line) =>
      line
        // admonition titles: <span class="publication-admonition-title …">Title</span>
        .replace(
          /<span class="publication-admonition-title[^"]*">([^<]*)<\/span>/g,
          (_m, title) => `**${title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")}**`,
        )
        // markdown images: runes -> name, dice -> glyph, others dropped
        .replace(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g, (_m, alt, src) => {
          if (/\/img\/publication\/dice\.svg$/.test(src)) return '🎲';
          const file = src.match(/\/img\/runes\/([^/]+)$/);
          return file ? `[${rune} ${runeName(file[1], alt, locale)}]` : '';
        })
        // inline <img>: same rules
        .replace(/<img\b[^>]*>/gi, (tag) => {
          const src = tag.match(/\bsrc=["']([^"']+)["']/)?.[1] ?? '';
          const alt = tag.match(/\balt=["']([^"']*)["']/)?.[1] ?? '';
          const file = src.match(/\/img\/runes\/([^/]+)$/);
          return file ? `[${rune} ${runeName(file[1], alt, locale)}]` : '';
        })
        // site-relative links -> absolute URLs
        .replace(/(\]\()\/(?!\/)/g, `$1${base}/`),
    );
    // Shift headings to match the depth in the book. Past level 6 Markdown has
    // no heading left, so emit bold text rather than collapsing a subsection
    // onto its own parent.
    return kept.map((line) => {
      const heading = line.match(/^(#{1,6})\s+(.*)$/);
      if (!heading) return line;
      const level = heading[1].length + headingShift;
      return level <= 6 ? `${'#'.repeat(level)} ${heading[2]}` : `**${heading[2]}**`;
    });
  });

  return text
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function llmHeader({locale, title, gameName, version, status, publicUrl}) {
  const t = headerText[locale];
  return [
    `# ${gameName} — ${title}`,
    '',
    `${t.version} : ${version}${status ? ` (${status})` : ''}`,
    t.license,
    t.trademark,
    `Source : ${publicUrl.replace(/\/+$/, '')}/${locale === 'fr' ? '' : `${locale}/`}`,
    '',
    `> ${t.instruction}`,
  ].join('\n');
}
