import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'index',
    {
      type: 'category',
      label: 'Commencer à jouer',
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
      label: 'Règles',
      link: {type: 'doc', id: 'rules/index'},
      items: [
        'rules/bets/index',
        {
          type: 'category',
          label: 'Résolution',
          link: {type: 'doc', id: 'rules/resolution/index'},
          items: [
            'rules/resolution/scale',
            'rules/resolution/problems',
            'rules/resolution/risk',
          ],
        },
        'rules/theism/index',
        'rules/animism/index',
        'rules/logic/index',
        'rules/mysticism/index',
        'rules/draconic/index',
        'rules/moon/index',
        'rules/illumination/index',
        'rules/chaos/index',
        'rules/taboos/index',
        'rules/heroquests/index',
        {
          type: 'category',
          label: 'Runes',
          link: {type: 'doc', id: 'rules/runes/index'},
          items: ['rules/runes/inspiration/index'],
        },
      ],
    },
    {type: 'doc', id: 'characters/index', label: 'Protagonistes'},
    {type: 'doc', id: 'facilitating/index', label: 'Porter le Temps'},
    {type: 'doc', id: 'narratives/index', label: 'Récits'},
    {type: 'doc', id: 'reference/index', label: 'Références'},
    {type: 'doc', id: 'notes/index', label: 'Notes'},
    {type: 'doc', id: 'about/index', label: 'À propos'},
    {
      type: 'link',
      label: 'Publications',
      href: '/publications/',
    },
  ],
};

export default sidebars;
