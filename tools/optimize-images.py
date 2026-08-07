#!/usr/bin/env python3
"""Convertit les PNG volumineux des histoires et du site en JPEG optimisés.

Les PNG de plus de --min-size octets sous content/assets/stories,
content/assets/srd et assets (racine du site) sont convertis en JPEG
(--quality, --max-dim, aplatis sur le fond du thème FBF7EF). L'original est
conservé à côté sous le nom <base>.original.png et les références
<base>.png -> <base>.jpg sont réécrites dans les fichiers markdown des
histoires, les documents srd/*.adoc, les layouts (_layouts) et _config.yml.

Idempotent : relancer le script ne modifie rien une fois le travail fait.
Utiliser --dry-run pour prévisualiser sans rien écrire.
"""

import argparse
import io
import os
import re
import sys

from PIL import Image

BG = (251, 247, 239)
ASSET_ROOTS = (
    os.path.join("content", "assets", "stories"),
    os.path.join("content", "assets", "srd"),
    "assets",
)
REF_TARGETS = (
    os.path.join("content", "fr", "stories"),
    os.path.join("content", "en", "stories"),
    "srd",
    "_layouts",
    "_config.yml",
)
REF_EXTENSIONS = (".md", ".adoc", ".html")


def die(message):
    sys.stderr.write("error: %s\n" % message)
    sys.exit(1)


def walk_pngs(project_root):
    found = []
    for root in ASSET_ROOTS:
        base = os.path.join(project_root, root)
        for dirpath, _, names in os.walk(base):
            for name in names:
                if not name.endswith(".png") or name.endswith(".original.png"):
                    continue
                found.append(os.path.join(dirpath, name))
    return found


def flatten(img):
    rgba = img.convert("RGBA")
    bg = Image.new("RGB", rgba.size, BG)
    bg.paste(rgba, mask=rgba.getchannel("A"))
    return bg


def to_jpeg_bytes(img, quality, max_dim):
    if max(img.size) > max_dim:
        img = img.copy()
        img.thumbnail((max_dim, max_dim), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=quality, optimize=True)
    return buf.getvalue()


def load_targets(project_root):
    targets = []
    for target in REF_TARGETS:
        base = os.path.join(project_root, target)
        if os.path.isfile(base):
            targets.append(base)
        elif os.path.isdir(base):
            for dirpath, _, names in os.walk(base):
                for name in names:
                    if name.endswith(REF_EXTENSIONS):
                        targets.append(os.path.join(dirpath, name))
    return targets


def plan_ref_rewrites(project_root, converted_bases):
    pattern = re.compile(
        r"\b(?:%s)\.png\b" % "|".join(re.escape(b) for b in converted_bases)
    )
    plan = {}
    for path in load_targets(project_root):
        with open(path, encoding="utf-8") as f:
            content = f.read()
        count = len(pattern.findall(content))
        if count:
            plan[path] = count
    return plan


def rewrite_refs(project_root, converted_bases, dry_run):
    pattern = re.compile(
        r"\b(?:%s)\.png\b" % "|".join(re.escape(b) for b in converted_bases)
    )
    for path in load_targets(project_root):
        with open(path, encoding="utf-8") as f:
            content = f.read()
        new_content = pattern.sub(lambda m: m.group(0)[:-4] + ".jpg", content)
        if new_content == content:
            continue
        if not dry_run:
            with open(path, "w", encoding="utf-8") as f:
                f.write(new_content)
        print("  refs: %s -> .jpg (%s)" % (os.path.relpath(path, project_root), "dry-run" if dry_run else "done"))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="affiche le plan sans rien écrire")
    parser.add_argument("--min-size", type=int, default=150000, help="taille minimale en octets (défaut 150000)")
    parser.add_argument("--quality", type=int, default=85, help="qualité JPEG (défaut 85)")
    parser.add_argument("--max-dim", type=int, default=1400, help="dimension max en pixels (défaut 1400)")
    args = parser.parse_args()

    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    pngs = walk_pngs(project_root)
    big = [p for p in pngs if os.path.getsize(p) > args.min_size]
    small = [p for p in pngs if os.path.getsize(p) <= args.min_size]

    converted_bases = {os.path.splitext(os.path.basename(p))[0] for p in big}
    small_bases = {os.path.splitext(os.path.basename(p))[0] for p in small}
    clash = converted_bases & small_bases
    if clash:
        die("basenames ambigus (PNG petit + gros homonyme): %s" % sorted(clash))

    if not big:
        print("Aucun PNG à convertir.")
        return

    total_before = sum(os.path.getsize(p) for p in big)
    total_after = 0
    print("PNG > %d octets : %d fichiers (%.1f Mo)" % (args.min_size, len(big), total_before / 1048576))
    print("")
    rows = []
    for path in sorted(big, key=lambda p: os.path.getsize(p), reverse=True):
        with Image.open(path) as img:
            jpg_bytes = to_jpeg_bytes(flatten(img), args.quality, args.max_dim)
        before = os.path.getsize(path)
        total_after += len(jpg_bytes)
        rel = os.path.relpath(path, project_root)
        rows.append((before, len(jpg_bytes), rel))
    for before, after, rel in rows:
        print("  %6.1f Ko -> %6.1f Ko  %s" % (before / 1024, after / 1024, rel))
    print("")
    print("Total: %.1f Mo -> %.1f Mo (-%.0f%%)" % (
        total_before / 1048576, total_after / 1048576,
        100 * (1 - total_after / total_before),
    ))

    print("")
    print("Réécriture de références .png -> .jpg :")
    refs = plan_ref_rewrites(project_root, converted_bases)
    for path, count in sorted(refs.items()):
        print("  %s (%d refs)" % (os.path.relpath(path, project_root), count))
    if not refs:
        print("  (aucune référence trouvée)")

    if args.dry_run:
        print("")
        print("Dry-run: aucun fichier modifié.")
        return

    print("")
    for path in big:
        base_path = path[:-4]
        orig_path = base_path + ".original.png"
        jpg_path = base_path + ".jpg"
        if os.path.isfile(orig_path):
            continue
        if os.path.isfile(jpg_path):
            os.rename(path, orig_path)
            print("  original: %s" % os.path.relpath(orig_path, project_root))
            continue
        with Image.open(path) as img:
            jpg_bytes = to_jpeg_bytes(flatten(img), args.quality, args.max_dim)
        with open(jpg_path, "wb") as f:
            f.write(jpg_bytes)
        os.rename(path, orig_path)
        print("  converti: %s -> %s" % (
            os.path.relpath(jpg_path, project_root),
            os.path.relpath(orig_path, project_root),
        ))
    rewrite_refs(project_root, converted_bases, dry_run=False)


if __name__ == "__main__":
    main()
