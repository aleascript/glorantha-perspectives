#!/usr/bin/env python3
"""Concatène les DOCX d'un répertoire en un seul Markdown lisible par une IA.

Les <nom>.docx du répertoire source (non récursif, filtrés par --pattern) sont
convertis avec pandoc puis assemblés, dans l'ordre naturel de leurs noms
(« 2 » avant « 10 », « 5.1 » avant « 5.2 »), dans le fichier de sortie.
Chaque document devient une section « # <nom> » précédée d'un repère
<!-- source : <nom>.docx --> ; ses propres titres sont décalés d'un niveau.
Titres, gras, italiques, listes et tableaux sont conservés, les images ignorées.

Un Markdown plus récent que tous les DOCX est laissé tel quel ; --force le refait.

Prérequis : pandoc (sudo apt install pandoc)

Les DOCX et le Markdown produit restent des œuvres de leurs auteurs : ce script
est destiné à un usage personnel. Ne placez ni les uns ni l'autre dans ce dépôt.
"""

import argparse
import fnmatch
import os
import re
import shutil
import subprocess
import sys
import tempfile

# Filtre pandoc qui retire les images : seul le texte intéresse une IA.
DROP_IMAGES_FILTER = "function Image(el) return {} end\n"


def die(message):
    sys.stderr.write("error: %s\n" % message)
    sys.exit(1)


def natural_key(name):
    return [int(part) if part.isdigit() else part.lower() for part in re.split(r"(\d+)", name)]


def list_docx(source, pattern):
    names = [
        name
        for name in os.listdir(source)
        if name.lower().endswith(".docx")
        and not name.startswith("~$")  # fichiers verrou de Word
        and fnmatch.fnmatch(name, pattern)
        and os.path.isfile(os.path.join(source, name))
    ]
    return [os.path.join(source, name) for name in sorted(names, key=natural_key)]


def is_up_to_date(docx_paths, md_path):
    if not os.path.isfile(md_path):
        return False
    md_time = os.path.getmtime(md_path)
    return all(md_time >= os.path.getmtime(path) for path in docx_paths)


def convert(docx_path, filter_path):
    result = subprocess.run(
        [
            "pandoc", docx_path,
            "--from", "docx",
            "--to", "gfm",
            "--wrap", "none",
            "--shift-heading-level-by", "1",
            "--lua-filter", filter_path,
        ],
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "pandoc a échoué")
    # pandoc sépare par <!-- --> deux listes voisines de styles différents.
    body = result.stdout.replace("\n\n<!-- -->\n\n", "\n\n").strip()
    name = os.path.basename(docx_path)
    title = os.path.splitext(name)[0]
    return "<!-- source : %s -->\n\n# %s\n\n%s" % (name, title, body)


def warn_if_in_repo(path, project_root):
    real = os.path.realpath(path)
    if real == project_root or real.startswith(project_root + os.sep):
        sys.stderr.write(
            "warning: %s est dans le dépôt ; le Markdown produit "
            "ne doit pas y être commité.\n" % os.path.relpath(real, project_root)
        )


def main():
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("source", help="répertoire contenant les DOCX")
    parser.add_argument("output", help="fichier Markdown à produire")
    parser.add_argument("--pattern", default="*", help="filtre sur les noms de fichiers, ex. 'Anyata*' (défaut : tous)")
    parser.add_argument("--force", action="store_true", help="reconstruit même un Markdown à jour")
    args = parser.parse_args()

    if not os.path.isdir(args.source):
        die("répertoire introuvable : %s" % args.source)
    if not shutil.which("pandoc"):
        die("pandoc introuvable ; l'installer (sudo apt install pandoc)")

    project_root = os.path.realpath(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    warn_if_in_repo(args.output, project_root)

    docx_paths = list_docx(args.source, args.pattern)
    if not docx_paths:
        print("Aucun DOCX correspondant dans %s." % args.source)
        return
    if not args.force and is_up_to_date(docx_paths, args.output):
        print("%s est à jour (--force pour le refaire)." % args.output)
        return

    sections = []
    failed = 0
    with tempfile.NamedTemporaryFile("w", suffix=".lua", delete=False) as f:
        f.write(DROP_IMAGES_FILTER)
        filter_path = f.name
    try:
        for docx_path in docx_paths:
            name = os.path.basename(docx_path)
            try:
                sections.append(convert(docx_path, filter_path))
            except Exception as error:  # un DOCX corrompu ne doit pas arrêter le lot
                sys.stderr.write("  échec    %s : %s\n" % (name, error))
                failed += 1
                continue
            print("  ajouté   %s" % name)
    finally:
        os.unlink(filter_path)

    if sections:
        out_dir = os.path.dirname(os.path.abspath(args.output))
        os.makedirs(out_dir, exist_ok=True)
        markdown = "\n\n".join(sections) + "\n"
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(markdown)
        print("")
        print("%d DOCX -> %s (%.0f Ko), %d en échec." % (
            len(sections), args.output, len(markdown.encode("utf-8")) / 1024, failed,
        ))
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
