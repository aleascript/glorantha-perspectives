# Glorantha Perspectives

Glorantha Perspectives est un jeu de rôle pour explorer Glorantha à travers les vérités, croyances et choix de ceux qui y vivent.

Le contenu éditorial canonique se trouve dans `docs/`. Les chemins de référence sont en anglais ; les titres et le texte restent dans la langue de publication.

## Développement local

Prérequis : Node.js 22 ou supérieur.

```bash
npm install
npm start
```

`npm start` est un alias de `npm run start:fr`.

### Commandes utiles

```bash
npm run start:fr           # serveur Docusaurus en français
npm run build              # build complet du site
npm run build:fr           # build français explicite
npm run preview            # build puis prévisualisation du site généré
npm run check              # typecheck + build
npm run clear              # nettoyage du cache Docusaurus
npm run typecheck          # vérification TypeScript
```

## Publications

Les publications sont composées depuis les mêmes fichiers Markdown que le site, selon `publications.config.mjs`.

```bash
npm run publication:build
npm run publications:build   # alias accepté
```

Les PDF et le manifeste sont générés dans `dist/publications/`.

Pour les copier dans le build du site sous `build/downloads/` :

```bash
npm run publication:site
npm run publications:site    # alias accepté
```

Pour préparer un build de release avec une version explicite :

```bash
npm run release:prepare -- 0.1.0
```

Cette commande génère les publications, construit le site puis copie les publications dans le site.

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
