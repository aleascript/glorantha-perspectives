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

Docusaurus ne sert qu'**une seule locale à la fois en mode développement**. Pour travailler directement sur la version anglaise, utilisez `npm run start:en`. Pour tester le site complet et le sélecteur de langue FR / EN dans les mêmes conditions que le build statique, utilisez `npm run preview`.

Si un changement de configuration, de plugin Markdown ou de locale semble ne pas être pris en compte après un changement de branche, `npm run clear` permet de supprimer le cache Docusaurus avant de relancer le serveur.

### Commandes utiles

```bash
npm run start:fr           # serveur Docusaurus en français
npm run start:en           # serveur Docusaurus en anglais
npm run build              # build complet du site, toutes locales
npm run build:fr           # build français explicite
npm run build:en           # build anglais explicite
npm run preview            # build complet puis prévisualisation multilingue
npm run check              # typecheck + build
npm run clear              # nettoyage du cache Docusaurus
npm run typecheck          # vérification TypeScript
```

## Publications

Les publications sont composées depuis les mêmes fichiers Markdown que le site, selon `publications.config.mjs`.

```bash
npm run publication:build
```

Les PDF et le manifeste sont générés dans `dist/publications/`.

Chaque publication déclare indépendamment sa version au format `YYYY-MM-DD`
dans `publications.config.mjs`, à côté de son statut.

Pour les copier dans le build du site sous `build/downloads/` :

```bash
npm run publication:site
```

Pour préparer un build de release avec les versions déclarées dans la
configuration :

```bash
npm run release:prepare
```

Cette commande génère les publications, construit le site puis copie les publications dans le site.

### Publication continue

Le workflow `.github/workflows/deploy-pages.yml` valide le site et toutes les
publications sur chaque pull request. Sur `main`, il déploie toujours le site
avec les PDF courants sous `/downloads/`.

Les releases GitHub constituent des snapshots éditoriaux distincts du
déploiement continu :

- chaque publication possède sa propre version calendaire ISO `YYYY-MM-DD` ;
- le workflow compare les couples `id` / `version` au manifeste de la dernière
  release `publications-*` ;
- si au moins une version a changé, il publie tous les PDF courants dans une
  release `publications-YYYY-MM-DD` ;
- plusieurs publications le même jour remplacent le snapshot de cette journée.

Une modification sans changement de version est donc visible sur le site, mais
ne crée pas de nouvelle release GitHub. Il faut mettre à jour la version de la
publication concernée pour en conserver un nouveau snapshot.

## Structure éditoriale

```text
docs/<lang>/
├── index.md
├── start/
├── protagonists/
├── time/
├── perspectives/
├── glorantha/
├── narratives/
├── reference/
├── notes/
├── about/
└── archives/      # corpus historique, actuellement surtout FR
```

La navigation publique est centrée sur **Commencer**, **Protagonistes**, **Le Temps**, **Perspectives**, **Glorantha**, **Récits** et **Référence**. `notes/` et `archives/` restent dans le corpus sans constituer des pans du manuel de jeu.

Les récits utilisent le répertoire de référence `narratives/` : par exemple `narratives/the-lunar-way/` pour *La Voie Lunaire*.

Glorantha Perspectives est conçu dans le cadre de Resonance et utilise Regard comme framework de game design.
