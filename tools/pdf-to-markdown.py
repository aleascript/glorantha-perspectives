#!/usr/bin/env python3
"""Convertit les PDF d'un répertoire en Markdown lisible par une IA.

Chaque <nom>.pdf du répertoire source (non récursif) produit <nom>.md, à côté
du PDF ou dans --out. Le texte est extrait avec pymupdf4llm, qui restitue
titres, listes, tableaux et colonnes ; les images sont ignorées. Chaque page
est précédée d'un repère <!-- page N --> pour pouvoir citer ses sources.

Les PDF scannés sans couche texte ne produisent rien d'utile : ils sont
signalés, pas convertis (l'OCR n'est pas couverte).

Un Markdown plus récent que son PDF est laissé tel quel ; --force le refait.

Prérequis : pymupdf4llm (voir le README pour l'installer dans un venv)

Les PDF et Markdown convertis restent des œuvres de leurs éditeurs : ce script
est destiné à un usage personnel, sur des PDF que vous possédez. Ne placez ni
les uns ni les autres dans ce dépôt.
"""

import argparse
import os
import sys

try:
    import pymupdf
    import pymupdf4llm
except ImportError:
    sys.stderr.write("error: pymupdf4llm manquant ; lancer ce script avec le Python du venv où il est installé (voir le README)\n")
    sys.exit(1)

# Moyenne de caractères par page sous laquelle un PDF est jugé sans couche texte.
MIN_CHARS_PER_PAGE = 50


def die(message):
    sys.stderr.write("error: %s\n" % message)
    sys.exit(1)


def list_pdfs(source):
    return sorted(
        os.path.join(source, name)
        for name in os.listdir(source)
        if name.lower().endswith(".pdf") and os.path.isfile(os.path.join(source, name))
    )


def is_up_to_date(pdf_path, md_path):
    return os.path.isfile(md_path) and os.path.getmtime(md_path) >= os.path.getmtime(pdf_path)


def convert(pdf_path):
    with pymupdf.open(pdf_path) as doc:
        chunks = pymupdf4llm.to_markdown(
            doc,
            page_chunks=True,
            ignore_images=True,
            show_progress=False,
        )
    pages = []
    for chunk in chunks:
        number = chunk["metadata"]["page_number"]
        pages.append("<!-- page %d -->\n\n%s" % (number, chunk["text"].strip()))
    title = os.path.splitext(os.path.basename(pdf_path))[0]
    text_chars = sum(len(chunk["text"].strip()) for chunk in chunks)
    return "# %s\n\n%s\n" % (title, "\n\n".join(pages)), len(chunks), text_chars


def warn_if_in_repo(path, project_root):
    real = os.path.realpath(path)
    if real == project_root or real.startswith(project_root + os.sep):
        sys.stderr.write(
            "warning: %s est dans le dépôt ; les PDF et Markdown convertis "
            "ne doivent pas y être commités.\n" % os.path.relpath(real, project_root)
        )


def main():
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("source", help="répertoire contenant les PDF")
    parser.add_argument("--out", help="répertoire des Markdown (défaut : le répertoire source)")
    parser.add_argument("--force", action="store_true", help="reconvertit même les Markdown à jour")
    args = parser.parse_args()

    if not os.path.isdir(args.source):
        die("répertoire introuvable : %s" % args.source)
    out_dir = args.out or args.source
    os.makedirs(out_dir, exist_ok=True)

    project_root = os.path.realpath(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    warn_if_in_repo(out_dir, project_root)

    pdfs = list_pdfs(args.source)
    if not pdfs:
        print("Aucun PDF dans %s." % args.source)
        return

    converted = skipped = failed = 0
    for pdf_path in pdfs:
        name = os.path.basename(pdf_path)
        md_path = os.path.join(out_dir, os.path.splitext(name)[0] + ".md")
        if not args.force and is_up_to_date(pdf_path, md_path):
            print("  à jour   %s" % name)
            skipped += 1
            continue
        try:
            markdown, page_count, text_chars = convert(pdf_path)
        except Exception as error:  # un PDF corrompu ne doit pas arrêter le lot
            sys.stderr.write("  échec    %s : %s\n" % (name, error))
            failed += 1
            continue
        if page_count and text_chars / page_count < MIN_CHARS_PER_PAGE:
            sys.stderr.write("  ignoré   %s : pas de couche texte (PDF scanné ?)\n" % name)
            failed += 1
            continue
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(markdown)
        print("  converti %s -> %s (%d pages, %.0f Ko)" % (
            name, os.path.basename(md_path), page_count, len(markdown.encode("utf-8")) / 1024,
        ))
        converted += 1

    print("")
    print("%d converti(s), %d à jour, %d en échec." % (converted, skipped, failed))
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
