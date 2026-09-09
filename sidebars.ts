import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const isFrench = (process.env.DOCUSAURUS_CURRENT_LOCALE ?? 'fr') === 'fr';
const t = (fr: string, en: string) => (isFrench ? fr : en);

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'index',
    {
      type: 'category',
      label: t('Commencer', 'Start'),
      link: {type: 'doc', id: 'start/index'},
      items: [
        'start/vocabulary',
        'start/glorantha',
        'start/table-agreement',
        'start/play-modes',
      ],
    },
    {
      type: 'category',
      label: t('Protagonistes', 'Protagonists'),
      link: {type: 'doc', id: 'protagonists/index'},
      items: ['protagonists/examples'],
    },
    {
      type: 'category',
      label: t('Le Temps', 'Time'),
      link: {type: 'doc', id: 'time/index'},
      items: [
        'time/runic-inspiration/index',
        'time/runes/index',
        'time/runic-imprint',
        'time/creating-myths/index',
        'time/generating-bonds/index',
        'time/calendar',
        'time/currency',
      ],
    },
    {
      type: 'category',
      label: t('Perspectives', 'Perspectives'),
      link: {type: 'doc', id: 'perspectives/index'},
      items: [
        {
          type: 'category',
          label: t('Mises', 'Bets'),
          link: {type: 'doc', id: 'perspectives/bets/index'},
          items: ['perspectives/bets/sample/index'],
        },
        {
          type: 'category',
          label: t('Résolution', 'Resolution'),
          link: {type: 'doc', id: 'perspectives/resolution/index'},
          items: [
            'perspectives/resolution/scale',
            'perspectives/resolution/problems',
            'perspectives/resolution/risk',
          ],
        },
        {
          type: 'category',
          label: t('Visions du monde', 'Worldviews'),
          items: [
            {
              type: 'category',
              label: t('Théisme', 'Theism'),
              link: {type: 'doc', id: 'perspectives/theism/index'},
              items: ['perspectives/theism/runic-cards/index'],
            },
            {
              type: 'category',
              label: t('Animisme', 'Animism'),
              link: {type: 'doc', id: 'perspectives/animism/index'},
              items: [
                'perspectives/animism/aptitudes/index',
                'perspectives/animism/spirit-bag/index',
              ],
            },
            'perspectives/logic/index',
            {
              type: 'category',
              label: t('Mysticisme', 'Mysticism'),
              link: {type: 'doc', id: 'perspectives/mysticism/index'},
              items: ['perspectives/mysticism/mystical-marbles/index'],
            },
            {
              type: 'category',
              label: t('Pensée draconique', 'Draconic Thought'),
              link: {type: 'doc', id: 'perspectives/draconic/index'},
              items: ['perspectives/draconic/ars-draconis-magica/index'],
            },
          ],
        },
        'perspectives/moon/index',
        'perspectives/illumination/index',
        'perspectives/chaos/index',
        'perspectives/taboos/index',
        'perspectives/heroquests/index',
      ],
    },
    {
      type: 'category',
      label: t('Récits', 'Narratives'),
      link: {type: 'doc', id: 'narratives/index'},
      items: [
        {
          type: 'category',
          label: t('La Voie Lunaire', 'The Lunar Way'),
          link: {type: 'doc', id: 'narratives/the-lunar-way/index'},
          items: [
            {
              type: 'category',
              label: t('Héros', 'Heroes'),
              items: [
                'narratives/the-lunar-way/heroes/jaridan/index',
                'narratives/the-lunar-way/heroes/ikarnos/index',
                'narratives/the-lunar-way/heroes/hanya/index',
                'narratives/the-lunar-way/heroes/peek-ee-peek/index',
              ],
            },
            {
              type: 'category',
              label: t('Récit', 'Story'),
              items: [
                'narratives/the-lunar-way/01/index',
                'narratives/the-lunar-way/02/index',
                'narratives/the-lunar-way/03/index',
                'narratives/the-lunar-way/04/index',
                'narratives/the-lunar-way/05/index',
                'narratives/the-lunar-way/06/index',
                'narratives/the-lunar-way/07/index',
                'narratives/the-lunar-way/08/index',
                'narratives/the-lunar-way/09/index',
                'narratives/the-lunar-way/10/index',
                'narratives/the-lunar-way/11/index',
                'narratives/the-lunar-way/12/index',
                'narratives/the-lunar-way/13/index',
                'narratives/the-lunar-way/14/index',
                'narratives/the-lunar-way/15/index',
                'narratives/the-lunar-way/16/index',
                'narratives/the-lunar-way/17/index',
              ],
            },
            'narratives/the-lunar-way/others/index',
          ],
        },
        {
          type: 'category',
          label: t('Les Héritiers de Zola Fel', 'Heirs of Zola Fel'),
          link: {type: 'doc', id: 'narratives/heirs-of-zola-fel/index'},
          items: [
            {
              type: 'category',
              label: t('Héros', 'Heroes'),
              items: [
                'narratives/heirs-of-zola-fel/heroes/duckita/index',
                'narratives/heirs-of-zola-fel/heroes/fazia/index',
                'narratives/heirs-of-zola-fel/heroes/irinus/index',
                'narratives/heirs-of-zola-fel/heroes/korlanth/index',
              ],
            },
          ],
        },
        'narratives/gurdtars-banishment/index',
        'narratives/talimar-road/index',
      ],
    },
    {
      type: 'category',
      label: t('Référence', 'Reference'),
      link: {type: 'doc', id: 'reference/index'},
      items: ['reference/faq', 'reference/probabilities'],
    },
    'about/index',
  ],
};

export default sidebars;
