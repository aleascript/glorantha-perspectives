# Glorantha Perspectives

Ressources diverses pour l'univers-jeu **Glorantha** : règles diégétiques, moteur
d'inspiration runique, histoires et notes.

## Prérequis

- **Ruby** 3.x ([ruby-lang.org](https://www.ruby-lang.org/))
- **Bundler**

### Installation de Ruby

```bash
# Ubuntu / Debian
sudo apt install ruby-full build-essential

# macOS (Homebrew)
brew install ruby

# Windows
# https://rubyinstaller.org/
```

### Installation de Bundler

```bash
gem install bundler
```

## Développement local

```bash
# 1. Cloner le projet
git clone https://github.com/aleascript/glorantha-perspectives.git
cd glorantha-perspectives

# 2. Installer les dépendances (gems)
bundle config set --local path vendor/bundle
bundle install

# 3. Lancer le serveur de développement
bundle exec jekyll serve
```

Le site est accessible sur **http://localhost:4000/glorantha-perspectives/**.

Le serveur rebuild automatiquement le site à chaque modification de fichier.

### Build statique (sans serveur)

```bash
bundle exec jekyll build
```

Les fichiers générés se trouvent dans le dossier `_site/`.

## Outils

Des scripts dans `tools/` permettent de générer le PDF du SRD.

### Prérequis techniques

- **asciidoctor-pdf** (pour `generate-srd-pdf.sh` et `generate-story-pdf.sh`)
- **pandoc** (pour `generate-story-pdf.sh` : conversion Markdown → AsciiDoc)
- **python3** (pour `generate-story-pdf.sh` : assemblage du document)

```bash
# Installation d'asciidoctor-pdf (gem Ruby)
gem install asciidoctor-pdf

# Installation de pandoc
sudo apt install pandoc
```

### `generate-srd-pdf.sh`

Convertit le SRD AsciiDoc `srd/glorantha-perspectives-${lang}.adoc` en PDF (page de garde, table des matières, runes intégrées) dans `content/${lang}/srd/`. Le PDF est nommé `glorantha-perspectives-${lang}.pdf` (sans version dans le nom, celle-ci étant lue dans l'attribut `:revnumber:` du document).

```bash
# Depuis la racine du projet (français par défaut)
bash tools/generate-srd-pdf.sh

# Autre langue (ex: anglais une fois le SRD traduit)
bash tools/generate-srd-pdf.sh en
```

Le rendu est contrôlé par le thème `tools/srd-pdf-theme.yml` (inspiration Glorantha) qui peut être personnalisé.

Le PDF `content/${lang}/srd/glorantha-perspectives-${lang}.pdf` est écrasé à chaque génération.

### `generate-story-pdf.sh`

Convertit l'histoire Markdown `content/${lang}/stories/${slug}/` en un PDF consolidé dans le même dossier. Le PDF contient, dans l'ordre : la présentation (`index.md`), les héros (`heroes/`), le récit (chapitres `NN/`) et le glossaire en annexe (`others/`), avec les images et une page de garde (`heroes.png`).

```bash
# Depuis la racine du projet (français par défaut)
bash tools/generate-story-pdf.sh la-voie-lunaire
bash tools/generate-story-pdf.sh les-heritiers-de-zola-fel

# Autre langue (ex: anglais)
bash tools/generate-story-pdf.sh la-voie-lunaire en
```

Les slugs disponibles sont `la-voie-lunaire` et `les-heritiers-de-zola-fel`. Le rendu réutilise le thème `tools/srd-pdf-theme.yml` (inspiration Glorantha). Le PDF `content/${lang}/stories/${slug}/${slug}.pdf` est écrasé à chaque génération ; il est référencé depuis la page d'accueil de l'histoire.

### Hooks git (génération automatique des PDF)

Un hook `pre-commit` versionné (`git-hooks/pre-commit`) régénère automatiquement les PDF SRD et les PDF des histoires lorsque leurs fichiers sources sont modifiés. Pour l'activer sur un clone :

```bash
bash tools/install-hooks.sh
```

Le hook s'exécute au moment du commit :
- il détecte les `srd/*.adoc` en staging,
- lance `tools/generate-srd-pdf.sh <lang>` pour chacun,
- il détecte les changements sous `content/{fr,en}/stories/<slug>/` et `content/assets/stories/<slug>/` (hors `.pdf`),
- lance `tools/generate-story-pdf.sh <slug> <lang>` pour chaque histoire concernée,
- stage les PDF régénérés (et les suppressions d'anciennes versions).

Si la génération échoue, le commit est annulé. Prérequis : `asciidoctor-pdf`, `pandoc` et `python3` (voir `install-hooks.sh`, qui les vérifie).

## Structure du projet

```
.
├── _config.yml          # Configuration Jekyll
├── _layouts/            # Templates HTML (layout principal)
│   └── default.html
├── assets/              # Fichiers statiques (CSS, images, JS)
│   └── css/
│       └── custom.scss
├── content/             # Contenu du site (pages Markdown)
│   ├── notes/           # Notes diverses
│   ├── stories/         # Histoires et sagas
│   └── rules/           # Règles diégétiques
├── git-hooks/           # Hooks git versionnés
│   └── pre-commit       # Régénère les PDF SRD et des histoires
├── tools/               # Scripts utilitaires
│   ├── generate-srd-pdf.sh
│   ├── generate-story-pdf.sh
│   ├── install-hooks.sh
│   ├── story-pdf.py
│   └── srd-pdf-theme.yml
├── index.md             # Page d'accueil
├── Gemfile              # Dépendances Ruby
├── .gitignore           # Fichiers ignorés par Git
└── README.md            # Ce fichier
```

## Ajouter du contenu

1. Créer un fichier Markdown dans le dossier `content/` correspondant
2. Ajouter un **front matter YAML** en tête de fichier :
   ```yaml
   ---
   title: Titre de la page
   ---
   ```
3. Si le titre contient des `:`, le mettre entre guillemets :
   ```yaml
   title: "Mon titre: sous-titre"
   ```
4. Vérifier le rendu local avec `bundle exec jekyll serve`

## Déploiement

Le site est automatiquement déployé sur **GitHub Pages** à chaque push sur `main`
via le support natif Jekyll de GitHub.

**URL :** https://aleascript.github.io/glorantha-perspectives/

### Configuration GitHub Pages

Dans **Settings > Pages** du dépôt :
- **Source** : `Deploy from a branch`
- **Branch** : `main`, dossier `/ (root)`

---

> *"This website uses trademarks and/or copyrights owned by Chaosium Inc/Moon
> Design Publications LLC, which are used under Chaosium Inc's Fan Material
> Policy. We are expressly prohibited from charging you to use or access this
> content. This website is not published, endorsed, or specifically approved by
> Chaosium Inc. For more information about Chaosium Inc's products, please visit
> [www.chaosium.com](https://www.chaosium.com)."*
