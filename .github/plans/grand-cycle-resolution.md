# Cible du refactor : le Grand Cycle de la résolution

> Statut : document de cadrage. Aucun refactor des pages de jeu n'est engagé dans ce commit.

Cette note fixe la cible d'un prochain refactor organisationnel de la résolution. Le travail commencera après la fusion de la PR consacrée aux images et le rebase de cette branche sur `main`.

## Principe

À chaque résolution, les joueurs parcourent les huit Runes de Pouvoir selon l'ordre numérique déjà employé par Glorantha Perspectives. La procédure n'est donc pas seulement un mécanisme : elle constitue un cycle runique qui transforme une Situation en une Situation nouvelle.

Ce cycle n'est pas une vérité cosmologique absolue. C'est **le Grand Cycle de la résolution selon Glorantha Perspectives**. GP ne révèle pas une métaphysique neutre surplombant Glorantha ; il possède lui-même une Perspective.

## Les huit étapes

| Étape | Rune | Fonction profonde |
| ---: | --- | --- |
| 1 | **Mouvement** | L’Intention imprime une direction à la Situation. |
| 2 | **Mort** | Les conséquences nomment ce qui peut finir, être perdu ou séparé. |
| 3 | **Harmonie** | La table accorde ses regards sur une question, une échelle et deux issues communes. |
| 4 | **Stase** | Facteurs Cadres et Mises fixent provisoirement l’état du monde « ici et maintenant ». |
| 5 | **Vie** | Le lancer anime cette constellation et fait naître une réponse encore potentielle. |
| 6 | **Désordre** | La Vision du monde défait l’idée d’une lecture numérique universelle et recompose le tirage selon sa propre ontologie. |
| 7 | **Vérité** | La comparaison établit ce que le réel a effectivement répondu. |
| 8 | **Illusion** | Cette vérité reçoit une apparence fictionnelle particulière, devient Situation vécue, puis engendre un nouveau Mouvement. |

## Les quatre mouvements

1. **Cadrer l’incertitude** : Mouvement / Mort
2. **Mettre en balance** : Harmonie / Stase
3. **Lire la réponse du réel** : Vie / Désordre
4. **Interpréter et continuer** : Vérité / Illusion

Ce découpage doit remplacer la répartition actuelle des huit étapes dans le chapitre détaillé, tout en conservant les fichiers existants.

## Formulation procédurale cible

1. dire ce que les Protagonistes, Forces ou autres acteurs engagés cherchent réellement à obtenir ;
2. rendre visibles les conséquences importantes qui ne sont pas évidentes ;
3. préciser le **Focus**, son **Zoom** et les **deux issues mises en balance** ;
4. repérer les **Facteurs Cadres** puis les **Mises** qui comptent ici et maintenant, en indiquant quelle issue chacune favorise ;
5. lancer les dés correspondant aux Mises de chaque côté ;
6. lire chaque tirage selon la **Vision du monde** qui s'y applique pour obtenir une **réponse du réel** ;
7. comparer les réponses pour établir l'issue et l'amplitude de la réponse du réel ;
8. donner à cette réponse une forme fictionnelle à partir de la Situation et des Mises, puis poursuivre depuis ce qui vient de changer.

La séparation des étapes 7 et 8 exprime le couple final : **Vérité tranche ; Illusion manifeste.**

## Cible organisationnelle

- `docs/fr/start/index.md` : présenter la séquence canonique des huit étapes ;
- `docs/fr/perspectives/resolution/index.md` : introduire explicitement le Grand Cycle et les quatre mouvements ;
- `framing.md` : étapes 1 et 2, Mouvement / Mort ;
- `balance.md` : étapes 3 et 4, Harmonie / Stase ;
- `reading-reality.md` : étapes 5 et 6, Vie / Désordre ;
- `interpretation.md` : étapes 7 et 8, Vérité / Illusion ;
- relier cette présentation à l'Inspiration runique et à la Méditation sur les runes ;
- employer les futurs styles d'images pour rendre les Runes visibles sans rendre leur symbolisme nécessaire à l'application de la procédure.

## Garde-fous

- Ne modifier aucune mécanique de résolution.
- Maintenir une procédure immédiatement utilisable sans connaissance ésotérique des Runes.
- Présenter le cycle comme la Perspective propre de GP, jamais comme l'unique ordre cosmologique vrai de Glorantha.
- Distinguer nettement la réponse établie par la comparaison de sa manifestation fictionnelle.

## Historique de conception

Le symbolisme numérique ne vient pas d'une attribution opportuniste. Un premier symbolisme des nombres 1 à 6 avait été élaboré par méditation pour un jeu antérieur, embryon de GP, avant l'introduction des Runes. Lors du développement de Glorantha Perspectives, la cosmologie complète portée par les Runes de Pouvoir a rendu naturelle l'association entre chaque pouvoir primordial et ce mapping numérique.

Le présent refactor rend explicite une résonance déjà inscrite dans les outils du jeu : la numérotation runique, la procédure de résolution et la transformation cyclique de la Situation décrivent désormais une même structure.
