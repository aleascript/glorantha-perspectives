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
      label: t('Règles', 'Rules'),
      link: {type: 'doc', id: 'rules/index'},
      items: [
        {
          type: 'category',
          label: t('Mises', 'Bets'),
          link: {type: 'doc', id: 'rules/bets/index'},
          items: ['rules/bets/sample/index'],
        },
        {
          type: 'category',
          label: t('Résolution', 'Resolution'),
          link: {type: 'doc', id: 'rules/resolution/index'},
          items: [
            'rules/resolution/scale',
            'rules/resolution/problems',
            'rules/resolution/risk',
          ],
        },
        {
          type: 'category',
          label: t('Théisme', 'Theism'),
          link: {type: 'doc', id: 'rules/theism/index'},
          items: ['rules/theism/runic-cards/index'],
        },
        {
          type: 'category',
          label: t('Animisme', 'Animism'),
          link: {type: 'doc', id: 'rules/animism/index'},
          items: [
            'rules/animism/aptitudes/index',
            'rules/animism/spirit-bag/index',
          ],
        },
        'rules/logic/index',
        {
          type: 'category',
          label: t('Mysticisme', 'Mysticism'),
          link: {type: 'doc', id: 'rules/mysticism/index'},
          items: ['rules/mysticism/mystical-marbles/index'],
        },
        {
          type: 'category',
          label: t('Pensée draconique', 'Draconic Thought'),
          link: {type: 'doc', id: 'rules/draconic/index'},
          items: ['rules/draconic/ars-draconis-magica/index'],
        },
        'rules/moon/index',
        'rules/illumination/index',
        'rules/chaos/index',
        'rules/taboos/index',
        'rules/heroquests/index',
        ...(!isFrench ? ['rules/heroquests/myths/index', 'rules/games/index'] : []),
        {
          type: 'category',
          label: t('Runes', 'Runes'),
          link: {type: 'doc', id: 'rules/runes/index'},
          items: ['rules/runes/inspiration/index'],
        },
      ],
    },
    {
      type: 'category',
      label: t('Protagonistes', 'Protagonists'),
      link: {type: 'doc', id: 'characters/index'},
      items: ['characters/examples', 'characters/ready-to-play'],
    },
    {
      type: 'category',
      label: t('Porter le Temps', 'Carrying Time'),
      link: {type: 'doc', id: 'facilitating/index'},
      items: [
        'facilitating/generating-bonds/index',
        'facilitating/creating-myths/index',
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
      ],
    },
    {
      type: 'category',
      label: t('Référence', 'Reference'),
      link: {type: 'doc', id: 'reference/index'},
      items: [
        {
          type: 'category',
          label: 'Glorantha',
          link: {type: 'doc', id: 'reference/glorantha/index'},
          items: [
            'reference/glorantha/calendar',
            'reference/glorantha/currency',
            'reference/glorantha/runic-imprint',
          ],
        },
        'reference/faq',
        'reference/probabilities',
      ],
    },
    {
      type: 'category',
      label: t('Notes', 'Notes'),
      link: {type: 'doc', id: 'notes/index'},
      items: [
        'notes/bets/index',
        'notes/gloranthix/index',
        'notes/inspiration/index',
        'notes/lived-worldviews/index',
        'notes/money/index',
        'notes/new-referentials/index',
        'notes/random-calendar/index',
        'notes/runes-meditation/index',
        'notes/runic-colors/index',
        'notes/runic-forms/index',
        'notes/stats/index',
        'notes/themas/index',
        'notes/yet-another-glorantha/index',
      ],
    },
    'about/index',
    ...(isFrench ? ['archives/srd-0.6-elements-a-statuer'] : []),
  ],
};

export default sidebars;
