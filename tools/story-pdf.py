#!/usr/bin/env python3
"""Assemble le contenu markdown d'une histoire en un document AsciiDoc consolidé.

Usage: story-pdf.py <slug> <lang>

Le document consolidé est écrit sur la sortie standard. Il contient, dans
l'ordre : la présentation (index.md), les héros, le récit (chapitres) et le
glossaire (others), avec les images résolues et une page de garde.
"""

import os
import re
import subprocess
import sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = os.path.join(PROJECT_ROOT, "content", "assets")

LABELS = {
    "fr": {
        "toc": "Table des matières",
        "heroes": "Les héros",
        "story": "Le récit",
        "glossary": "Glossaire",
    },
    "en": {
        "toc": "Table of contents",
        "heroes": "The heroes",
        "story": "The story",
        "glossary": "Glossary",
    },
}

NAV_TABLE_RE = re.compile(r"^\|\s*\[(?:Précédent|Previous)\b.*$")
DROPPED_SECTION_RE = re.compile(r"^#\s+(?:L'histoire|The story)\s*$")
NEXT_HEADING_RE = re.compile(r"^#\s")
IMAGE_MD_RE = re.compile(r"!\[([^\]]*)\]\(([^)]+)\)")
IMAGE_HTML_RE = re.compile(r"<img\b[^>]*>", re.IGNORECASE)
IMG_SRC_RE = re.compile(r'src="([^"]+)"', re.IGNORECASE)
IMG_WIDTH_RE = re.compile(r'width="([0-9]+(?:\.[0-9]+)?)%"', re.IGNORECASE)
ANCHOR_RE = re.compile(r'<a\s+id="([^"]+)"\s*></a>', re.IGNORECASE)
ANCHOR_MARKER_RE = re.compile(r"@@ANCHOR_([^@]+)@@")


def die(message):
    sys.stderr.write("error: %s\n" % message)
    sys.exit(1)


def story_dir(slug, lang):
    return os.path.join(PROJECT_ROOT, "content", lang, "stories", slug)


def parse_front_matter(text):
    """Retourne (title, body) en extrayant le front matter Jekyll."""
    if not text.startswith("---"):
        return None, text
    lines = text.split("\n")
    end = None
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            end = i
            break
    if end is None:
        return None, text
    title = None
    for line in lines[1:end]:
        m = re.match(r'^title:\s*["\']?(.*?)["\']?\s*$', line)
        if m:
            title = m.group(1)
            break
    return title, "\n".join(lines[end + 1:])


def drop_chapter_list(body):
    """Retire la section 'L'histoire'/'The story' de la présentation."""
    lines = body.split("\n")
    start = None
    for i, line in enumerate(lines):
        if DROPPED_SECTION_RE.match(line):
            start = i
            break
    if start is None:
        return body
    end = len(lines)
    for i in range(start + 1, len(lines)):
        if NEXT_HEADING_RE.match(lines[i]):
            end = i
            break
    return "\n".join(lines[:start] + lines[end:])


def resolve_ref(ref, file_dir, adoc_dir):
    if re.match(r"^(?:[a-zA-Z][a-zA-Z0-9+.-]*:|#|//)", ref):
        return ref
    resolved = os.path.normpath(os.path.join(file_dir, ref))
    return os.path.relpath(resolved, adoc_dir)


def convert_html_img(match, file_dir, adoc_dir):
    tag = match.group(0)
    src = IMG_SRC_RE.search(tag)
    if not src:
        return tag
    ref = resolve_ref(src.group(1), file_dir, adoc_dir)
    width = IMG_WIDTH_RE.search(tag)
    if width:
        return "![](%s){width=\"%s%%\"}" % (ref, width.group(1))
    return "![](%s)" % ref


def preprocess(body, file_dir, adoc_dir):
    body = ANCHOR_RE.sub(lambda m: "@@ANCHOR_%s@@" % m.group(1), body)
    lines = [l for l in body.split("\n") if not NAV_TABLE_RE.match(l)]
    body = "\n".join(lines)
    body = IMAGE_MD_RE.sub(
        lambda m: "![%s](%s)" % (m.group(1), resolve_ref(m.group(2), file_dir, adoc_dir)),
        body,
    )
    body = IMAGE_HTML_RE.sub(
        lambda m: convert_html_img(m, file_dir, adoc_dir), body
    )
    return body


def offset_headings(text, offset):
    if offset == 0:
        return text
    return re.sub(
        r"^(=+)(?=\s)",
        lambda m: "=" * (len(m.group(1)) + offset),
        text,
        flags=re.MULTILINE,
    )


IMG_ATTR_RE = re.compile(r"(image:+) ?([^\s\[\],]+)\[([^\]]*)\]")


def clean_image_alt(out):
    """Retire l'alt reposé sur l'URL (sans extension) par pandoc pour les images."""

    def repl(match):
        prefix, url, attrs = match.group(1), match.group(2), match.group(3)
        noext = re.sub(r"\.[^./]+$", "", url)
        if attrs == url or attrs == noext:
            attrs = ""
        elif attrs.startswith(noext + ","):
            attrs = attrs[len(noext):]
        return "%s%s[%s]" % (prefix, url, attrs)

    return IMG_ATTR_RE.sub(repl, out)


def run_pandoc(body):
    try:
        proc = subprocess.run(
            ["pandoc", "-f", "markdown", "-t", "asciidoc", "--wrap=none"],
            input=body,
            capture_output=True,
            text=True,
        )
    except FileNotFoundError:
        die("pandoc n'est pas installé")
    if proc.returncode != 0:
        die("pandoc a échoué: %s" % proc.stderr.strip())
    return proc.stdout


def process_md(body, src_path, adoc_dir, offset):
    file_dir = os.path.dirname(os.path.abspath(src_path))
    out = run_pandoc(preprocess(body, file_dir, adoc_dir))
    out = clean_image_alt(out)
    out = ANCHOR_MARKER_RE.sub(lambda m: "[[%s]]" % m.group(1), out)
    return offset_headings(out, offset).strip()


def glob_story(directory, pattern):
    if not os.path.isdir(directory):
        return []
    results = []
    for entry in os.listdir(directory):
        candidate = os.path.join(directory, entry, "index.md")
        if re.match(pattern, entry) and os.path.isfile(candidate):
            results.append(candidate)
    return sorted(results)


def main():
    if len(sys.argv) < 3:
        die("usage: story-pdf.py <slug> <lang>")
    slug, lang = sys.argv[1], sys.argv[2]
    if lang not in LABELS:
        die("langue non supportée: %s" % lang)
    labels = LABELS[lang]

    sdir = story_dir(slug, lang)
    if not os.path.isdir(sdir):
        die("dossier introuvable: %s" % sdir)

    index_path = os.path.join(sdir, "index.md")
    if not os.path.isfile(index_path):
        die("index.md introuvable dans %s" % sdir)
    with open(index_path, encoding="utf-8") as f:
        index_text = f.read()
    doc_title, index_body = parse_front_matter(index_text)
    if not doc_title:
        doc_title = slug

    out = []
    out.append("= %s" % doc_title)
    out.append(":doctype: book")
    out.append(":toc:")
    out.append(":toclevels: 2")
    out.append(":toc-title: %s" % labels["toc"])
    cover = os.path.join(ASSETS_DIR, "stories", slug, "heroes", "heroes.png")
    if not os.path.isfile(cover):
        cover = os.path.join(ASSETS_DIR, "stories", slug, "heroes", "heroes.jpg")
    if os.path.isfile(cover):
        rel_cover = os.path.relpath(cover, sdir)
        out.append(":title-logo-image: image:%s[width=250]" % rel_cover)
    out.append(":lang: %s" % lang)
    out.append("")

    out.append(process_md(drop_chapter_list(index_body), index_path, sdir, 0))
    out.append("")

    hero_files = glob_story(os.path.join(sdir, "heroes"), r".+")
    if hero_files:
        out.append("== %s" % labels["heroes"])
        out.append("")
        for hp in hero_files:
            with open(hp, encoding="utf-8") as f:
                hero_text = f.read()
            hero_title, hero_body = parse_front_matter(hero_text)
            if not hero_body.strip():
                continue
            out.append("=== %s" % (hero_title or os.path.basename(os.path.dirname(hp))))
            out.append("")
            out.append(process_md(hero_body, hp, sdir, 2))
            out.append("")

    chapter_files = glob_story(sdir, r"[0-9][0-9]")
    if chapter_files:
        out.append("== %s" % labels["story"])
        out.append("")
        for cp in chapter_files:
            with open(cp, encoding="utf-8") as f:
                chapter_text = f.read()
            chapter_title, chapter_body = parse_front_matter(chapter_text)
            if not chapter_body.strip():
                continue
            out.append("=== %s" % (chapter_title or os.path.basename(os.path.dirname(cp))))
            out.append("")
            out.append(process_md(chapter_body, cp, sdir, 2))
            out.append("")

    others_path = os.path.join(sdir, "others", "index.md")
    if os.path.isfile(others_path):
        with open(others_path, encoding="utf-8") as f:
            others_text = f.read()
        _, others_body = parse_front_matter(others_text)
        if others_body.strip():
            out.append("== %s" % labels["glossary"])
            out.append("")
            out.append(process_md(others_body, others_path, sdir, 1))
            out.append("")

    sys.stdout.write("\n".join(out) + "\n")


if __name__ == "__main__":
    main()
