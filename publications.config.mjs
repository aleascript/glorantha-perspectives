export function definePublications(config) {
  return config;
}

function mapDocumentTree(tree, mapPath) {
  return tree.map((node) => {
    if (typeof node === 'string') return mapPath(node);
    const children = mapDocumentTree(node.children ?? [], mapPath);
    return node.path
      ? {...node, path: mapPath(node.path), children}
      : {...node, children};
  });
}

function flattenDocumentTree(tree) {
  return tree.flatMap((node) => {
    if (typeof node === 'string') return [node];
    return [
      ...(node.path ? [node.path] : []),
      ...flattenDocumentTree(node.children ?? []),
    ];
  });
}

function guideDocumentTree(locale) {
  return [
    'index.md',
    {
      path: 'start/index.md',
      children: [
        'start/vocabulary.md',
        'start/glorantha.md',
        'start/table-agreement.md',
        'start/play-modes.md',
      ],
    },
    {
      path: 'protagonists/index.md',
      children: ['protagonists/examples.md', 'perspectives/taboos/index.md'],
    },
    {
      path: 'time/index.md',
      children: [
        'time/runic-inspiration/index.md',
        'time/runes/index.md',
        'time/runic-imprint.md',
        'time/generating-bonds/index.md',
        'time/calendar.md',
        'time/currency.md',
      ],
    },
    {
      path: 'perspectives/index.md',
      children: [
        'perspectives/bets/index.md',
        {
          path: 'perspectives/resolution/index.md',
          children: [
            'perspectives/resolution/framing.md',
            'perspectives/resolution/balance.md',
            'perspectives/resolution/reading-reality.md',
            'perspectives/resolution/interpretation.md',
          ],
        },
        {
          path: 'perspectives/worldviews/index.md',
          children: [
            'perspectives/theism/index.md',
            'perspectives/animism/index.md',
            'perspectives/logic/index.md',
            'perspectives/mysticism/index.md',
            'perspectives/draconic/index.md',
          ],
        },
        {
          path: 'perspectives/influences/index.md',
          children: [
            'perspectives/moon/index.md',
            'perspectives/illumination/index.md',
            'perspectives/chaos/index.md',
          ],
        },
        'perspectives/heroquests/index.md',
        'perspectives/creating-myths/index.md',
        'perspectives/discovering-a-worldview/index.md',
      ],
    },
    {
      label: locale === 'fr' ? 'Référence' : 'Reference',
      children: ['reference/faq.md', 'reference/probabilities.md'],
    },
    'about/index.md',
  ];
}

function guideStructure(locale) {
  return mapDocumentTree(
    guideDocumentTree(locale),
    (document) => `docs/${locale}/${document}`,
  );
}

function guideContents(locale) {
  return flattenDocumentTree(guideStructure(locale));
}

function mementoStructure(locale) {
  const root = `publication/quick-reference/${locale}`;
  return [
    `${root}/index.md`,
    `${root}/resolution.md`,
    `${root}/visions.md`,
    `${root}/influences.md`,
    `${root}/oracle.md`,
  ];
}

function mementoContents(locale) {
  return flattenDocumentTree(mementoStructure(locale));
}

const lunarWayHeroes = ['jaridan', 'ikarnos', 'hanya', 'peek-ee-peek'];
const lunarWayChapters = Array.from({length: 17}, (_, index) =>
  String(index + 1).padStart(2, '0'),
);

function lunarWayStructure(locale) {
  const root = `docs/${locale}/narratives/the-lunar-way`;
  return [
    `${root}/index.md`,
    {
      label: locale === 'fr' ? 'Héros' : 'Heroes',
      children: lunarWayHeroes.map((hero) => `${root}/heroes/${hero}/index.md`),
    },
    {
      label: locale === 'fr' ? 'Récit' : 'Story',
      children: lunarWayChapters.map((chapter) => `${root}/${chapter}/index.md`),
    },
    `${root}/others/index.md`,
  ];
}

function lunarWayContents(locale) {
  return flattenDocumentTree(lunarWayStructure(locale));
}

const tocConfig = {
  sectionDepth: 0,
  documentDepth: 2,
  skipFirstDocument: true,
  numbered: false,
  pageNumbers: true,
};

function tocWithStructure(structure) {
  return {...tocConfig, documents: structure};
}

export default definePublications({
  site: {
    publicUrl: 'https://aleascript.github.io/glorantha-perspectives',
    defaultLocale: 'fr',
  },
  publications: {
    guide: {
      author: 'AleaScript',
      version: '2026-09-11',
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
          toc: tocWithStructure(guideStructure('fr')),
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
          toc: tocWithStructure(guideStructure('en')),
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
    quickreference: {
      author: 'AleaScript',
      version: '2026-09-11',
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
      outputName: 'glorantha-perspectives-quick-reference',
      locales: {
        fr: {
          title: 'Mémento',
          tocTitle: 'Sommaire',
          toc: tocWithStructure(mementoStructure('fr')),
          cover: {
            image: '/img/site/glorantha-perspectives-emblem.png',
            alt: 'Glorantha Perspectives',
            seriesTitle: 'Glorantha Perspectives',
          },
          contents: mementoContents('fr'),
          outputs: ['pdf'],
        },
        en: {
          title: 'Quick Reference',
          tocTitle: 'Contents',
          toc: tocWithStructure(mementoStructure('en')),
          cover: {
            image: '/img/site/glorantha-perspectives-emblem.png',
            alt: 'Glorantha Perspectives',
            seriesTitle: 'Glorantha Perspectives',
          },
          contents: mementoContents('en'),
          outputs: ['pdf'],
        },
      },
    },
    'the-lunar-way': {
      author: 'AleaScript',
      version: '2021-05-01',
      versionPolicy: 'fixed',
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
          toc: tocWithStructure(lunarWayStructure('fr')),
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
          toc: tocWithStructure(lunarWayStructure('en')),
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
