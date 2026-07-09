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
