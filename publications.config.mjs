export function definePublications(config) {
  return config;
}

const guideDocuments = [
  'index.md',
  'start/index.md',
  'start/vocabulary.md',
  'start/glorantha.md',
  'start/table-agreement.md',
  'start/play-modes.md',
  'protagonists/index.md',
  'protagonists/examples.md',
  'time/index.md',
  'time/runic-inspiration/index.md',
  'time/runes/index.md',
  'time/runic-imprint.md',
  'time/creating-myths/index.md',
  'time/generating-bonds/index.md',
  'time/calendar.md',
  'time/currency.md',
  'perspectives/index.md',
  'perspectives/bets/index.md',
  'perspectives/resolution/index.md',
  'perspectives/resolution/scale.md',
  'perspectives/resolution/problems.md',
  'perspectives/resolution/risk.md',
  'perspectives/theism/index.md',
  'perspectives/animism/index.md',
  'perspectives/logic/index.md',
  'perspectives/mysticism/index.md',
  'perspectives/draconic/index.md',
  'perspectives/moon/index.md',
  'perspectives/illumination/index.md',
  'perspectives/chaos/index.md',
  'perspectives/taboos/index.md',
  'perspectives/heroquests/index.md',
  'reference/faq.md',
  'reference/probabilities.md',
  'about/index.md',
];

function guideContents(locale) {
  return guideDocuments.map((document) => `docs/${locale}/${document}`);
}

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

const tocConfig = {
  sectionDepth: 0,
  skipFirstDocument: true,
  numbered: false,
  pageNumbers: true,
};

export default definePublications({
  site: {
    publicUrl: 'https://aleascript.github.io/glorantha-perspectives',
    defaultLocale: 'fr',
  },
  publications: {
    guide: {
      author: 'AleaScript',
      version: '2026-09-09',
      status: 'Draft',
      lineage: {
        designedWith: {
          label: 'Regard',
          href: 'https://aleascript.github.io/regard/',
        },
        poweredBy: null,
      },
      size: 'A5',
      theme: 'publication/theme.css',
      outputName: 'glorantha-perspectives-guide',
      locales: {
        fr: {
          title: 'Guide de jeu',
          tocTitle: 'Sommaire',
          toc: tocConfig,
          cover: {
            image: '/img/site/glorantha-perspectives-emblem.png',
            alt: 'Glorantha Perspectives',
            //seriesTitle: 'Glorantha Perspectives',
          },
          contents: guideContents('fr'),
          outputs: ['pdf'],
        },
        en: {
          title: 'Player Guide',
          tocTitle: 'Contents',
          toc: tocConfig,
          cover: {
            image: '/img/site/glorantha-perspectives-emblem.png',
            alt: 'Glorantha Perspectives',
            //seriesTitle: 'Glorantha Perspectives',
          },
          contents: guideContents('en'),
          outputs: ['pdf'],
        },
      },
    },
    'the-lunar-way': {
      author: 'AleaScript',
      version: '2021-04-01',
      status: 'To be continued',
      lineage: {
        designedWith: {
          label: 'Regard',
          href: 'https://aleascript.github.io/regard/',
        },
        poweredBy: null,
      },
      size: 'A5',
      theme: 'publication/theme.css',
      outputName: 'the-lunar-way',
      locales: {
        fr: {
          title: 'La Voie Lunaire',
          tocTitle: 'Sommaire',
          toc: tocConfig,
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
          toc: tocConfig,
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
