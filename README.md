# Glorantha Perspectives

Glorantha Perspectives est un jeu de rôle pour explorer Glorantha à travers les vérités, croyances et choix de ceux qui y vivent.

Le contenu éditorial canonique se trouve dans `docs/`. Les chemins de référence sont en anglais ; les titres et le texte restent dans la langue de publication.

## Développement local

Prérequis : Node.js 22 ou supérieur.

```bash
npm install
npm start
```

Le site Docusaurus est servi localement avec le contenu français.

## Vérification

```bash
npm run check
```

## Structure

```text
docs/
├── assets/
└── fr/
    ├── start/
    ├── rules/
    ├── characters/
    ├── facilitating/
    ├── narratives/
    ├── reference/
    └── about/
```

Les récits utilisent le répertoire de référence `narratives/` : par exemple `narratives/the-lunar-way/` pour *La Voie Lunaire*.

Glorantha Perspectives est conçu dans le cadre de Resonance et utilise Regard comme framework de game design.
