export function definePublications(config) {
  return config;
}

const guideFr = [
  'docs/fr/index.md',
  'docs/fr/start/index.md',
  'docs/fr/start/vocabulary.md',
  'docs/fr/start/glorantha.md',
  'docs/fr/start/table-agreement.md',
  'docs/fr/start/play-modes.md',
  'docs/fr/protagonists/index.md',
  'docs/fr/protagonists/examples.md',
  'docs/fr/protagonists/ready-to-play.md',
  'docs/fr/time/index.md',
  'docs/fr/time/runic-inspiration/index.md',
  'docs/fr/time/generating-bonds/index.md',
  'docs/fr/time/creating-myths/index.md',
  'docs/fr/perspectives/index.md',
  'docs/fr/perspectives/bets/index.md',
  'docs/fr/perspectives/resolution/index.md',
  'docs/fr/perspectives/resolution/scale.md',
  'docs/fr/perspectives/resolution/problems.md',
  'docs/fr/perspectives/resolution/risk.md',
  'docs/fr/perspectives/theism/index.md',
  'docs/fr/perspectives/animism/index.md',
  'docs/fr/perspectives/logic/index.md',
  'docs/fr/perspectives/mysticism/index.md',
  'docs/fr/perspectives/draconic/index.md',
  'docs/fr/perspectives/moon/index.md',
  'docs/fr/perspectives/illumination/index.md',
  'docs/fr/perspectives/chaos/index.md',
  'docs/fr/perspectives/taboos/index.md',
  'docs/fr/perspectives/heroquests/index.md',
  'docs/fr/glorantha/index.md',
  'docs/fr/glorantha/runes/index.md',
  'docs/fr/glorantha/calendar.md',
  'docs/fr/glorantha/currency.md',
  'docs/fr/glorantha/runic-imprint.md',
];

const lunarWayHeroes = ['jaridan', 'ikarnos', 'hanya', 'peek-ee-peek'];
const lunarWayChapters = Array.from({length: 17}, (_, index) =>
  String(index + 1).padStart(2, '0'),
);

function lunarWayContents(locale) {
  const root = `docs/${locale}/narratives/the-lunar-way`;
  return [
    `${root}/index.md`,
    ...lunarWayHeroes.map((hero) => `${root}/heroes/${hero}/index.md`),
    ...lunarWayChapters.map((chapter) => `${root}/${chapter}/index.md`),
    `${root}/others/index.md`,
  ];
}

const lunarWayToc = {
  sectionDepth: 0,
  skipFirstDocument: true,
  numbered: false,
  pageNumbers: true,
};

export default definePublications({
  release: {
    initialVersion: '0.1.0',
  },
  publications: {
    guide: {
      author: 'AleaScript',
      revision: 'Draft',
      lineage: {
        designedWith: {
          label: 'Resonance',
          href: 'https://aleascript.github.io/resonance/',
        },
        poweredBy: {
          label: 'Regard',
          href: 'https://aleascript.github.io/regard/',
        },
      },
      size: 'A5',
      theme: 'publication/theme.css',
      outputName: 'glorantha-perspectives-guide',
      locales: {
        fr: {
          title: 'Glorantha Perspectives — Guide de jeu',
          tocTitle: 'Sommaire',
          contents: guideFr,
          outputs: ['pdf'],
        },
      },
    },
    'the-lunar-way': {
      author: 'AleaScript',
      revision: 'Draft',
      lineage: {
        designedWith: {
          label: 'Resonance',
          href: 'https://aleascript.github.io/resonance/',
        },
        poweredBy: {
          label: 'Regard',
          href: 'https://aleascript.github.io/regard/',
        },
      },
      size: 'A5',
      theme: 'publication/theme.css',
      outputName: 'the-lunar-way',
      locales: {
        fr: {
          title: 'La Voie Lunaire',
          tocTitle: 'Sommaire',
          toc: lunarWayToc,
          cover: {
            image: '/img/narratives/the-lunar-way/heroes/heroes.original.png',
            alt: 'Les quatre héros de La Voie Lunaire',
            seriesTitle: 'Glorantha Perspectives',
          },
          contents: lunarWayContents('fr'),
          outputs: ['pdf'],
        },
        en: {
          title: 'The Lunar Way',
          tocTitle: 'Contents',
          toc: lunarWayToc,
          cover: {
            image: '/img/narratives/the-lunar-way/heroes/heroes.original.png',
            alt: 'The four heroes of The Lunar Way',
            seriesTitle: 'Glorantha Perspectives',
          },
          contents: lunarWayContents('en'),
          outputs: ['pdf'],
        },
      },
    },
  },
});
