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

Deux scripts dans `tools/` permettent de générer un document unique contenant tout le contenu du site.

### Prérequis techniques

- **Python** 3.x (pour `generate-full-content.sh`)
- **pandoc** (pour `generate-pdf.sh`)
- **weasyprint** (pour `generate-pdf.sh`)

```bash
# Ubuntu / Debian
sudo apt install pandoc weasyprint

# macOS (Homebrew)
brew install pandoc weasyprint
```

### `generate-full-content.sh`

Génère `full-content.md` à la racine du projet en concaténant toutes les pages Markdown de `content/rules/` et `content/notes/`.

```bash
# Depuis la racine du projet
python3 tools/generate-full-content.sh

# Depuis tools/
cd tools && python3 generate-full-content.sh
```

L'algorithme :
1. Page d'index de la section → liens directs (même section) → orphelins
2. Même logique pour chaque section (rules puis notes)

### `generate-pdf.sh`

Convertit `full-content.md` en `full-content.pdf` (A4, images intégrées, styles CSS).

```bash
# Depuis la racine du projet
bash tools/generate-pdf.sh

# Depuis tools/
cd tools && bash generate-pdf.sh
```

Le fichier `tools/pdf-style.css` est généré automatiquement à la première exécution et peut être personnalisé.

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
├── tools/               # Scripts utilitaires
│   ├── generate-full-content.sh
│   ├── generate-pdf.sh
│   └── pdf-style.css
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
