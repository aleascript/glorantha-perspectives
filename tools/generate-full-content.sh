#!/usr/bin/env python3
"""
Generate full-content/index.md: concatenates all rules and notes pages
from the Glorantha Perspectives Jekyll site.

Supports both French (FR) and English (EN) versions.

Algorithm per section:
  1. Process the root index page
  2. Process direct links from the root (same section only)
  3. Process remaining orphan pages not yet included
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent.resolve()

LANGUAGES = {
    "fr": {
        "content_subdir": "content/fr",
        "out_dir": "full-content",
        "title": "Full Content (Rules & Notes only)",
    },
    "en": {
        "content_subdir": "content/en",
        "out_dir": "content/en/full-content",
        "title": "Full Content - English (Rules & Notes only)",
    },
}


def parse_front_matter(text):
    """Extract title from Jekyll front matter, return (title, content)."""
    m = re.match(r'^---\s*\n(.*?)\n---\s*\n', text, re.DOTALL)
    if not m:
        return None, text
    fm = m.group(1)
    title_match = re.search(r'^title:\s*["\']?(.*?)["\']?\s*$', fm, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else None
    content = text[m.end():]
    return title, content


def parse_links(text):
    """Extract relative markdown links (skip images, external URLs, anchors)."""
    links = []
    for m in re.finditer(r'(?<!!)\[([^\]]*)\]\(([^)]+)\)', text):
        target = m.group(2)
        if target.startswith(('http://', 'https://', '#', 'mailto:')):
            continue
        links.append(target)
    return links


def resolve_link(source_file, link_target):
    """Resolve a relative link to a .md file path from project root."""
    source_dir = source_file.parent
    candidate = source_dir / link_target

    if candidate.is_file() and candidate.suffix == '.md':
        return candidate

    idx = candidate / "index.md"
    if idx.is_file():
        return idx

    with_md = candidate.with_suffix('.md')
    if with_md.is_file():
        return with_md

    return None


def fix_image_paths(text, page_dir_from_root):
    """Convert image src paths to be relative to project root."""
    page_dir = Path(page_dir_from_root)

    def replace_img(m):
        alt = m.group(1)
        src = m.group(2)
        if src.startswith(('http://', 'https://', 'data:')):
            return m.group(0)
        img_full = ROOT / page_dir / src
        try:
            img_full.resolve().relative_to(ROOT)
        except ValueError:
            return m.group(0)
        return f'![{alt}]({img_full})'

    return re.sub(r'!\[([^\]]*)\]\(([^)]+)\)', replace_img, text)


def process_file(md_path, visited, output_lines):
    """Read, process, and append a markdown file to the output."""
    rel = md_path.resolve().relative_to(ROOT)
    if rel in visited:
        return
    visited.add(rel)

    text = md_path.read_text(encoding='utf-8')
    title, content = parse_front_matter(text)

    if title is None:
        return

    if output_lines:
        output_lines.append("\n---\n")

    output_lines.append(f"\n# {title}\n")

    # Remove first heading from body if it matches the title
    content = re.sub(r'^#\s+' + re.escape(title) + r'\s*\n', '', content, count=1)

    page_dir = md_path.parent.relative_to(ROOT)
    content = fix_image_paths(content, page_dir)

    output_lines.append(content)


def is_in_section(resolved_path, section_dir):
    """Check if a resolved path belongs to the given section."""
    try:
        resolved_path.resolve().relative_to(section_dir.resolve())
        return True
    except ValueError:
        return False


def process_section(section_dir, visited, output_lines):
    """
    Process a section:
      1. Root index page
      2. Direct links from root (same section only, no recursion)
      3. Remaining orphan pages
    """
    index_path = section_dir / "index.md"

    if not index_path.is_file():
        return

    # 1. Root page
    process_file(index_path, visited, output_lines)

    # 2. Direct links from root, same section only
    text = index_path.read_text(encoding='utf-8')
    links = parse_links(text)

    for link in links:
        resolved = resolve_link(index_path, link)
        if resolved and resolved.exists() and is_in_section(resolved, section_dir):
            process_file(resolved, visited, output_lines)

    # 3. Orphans
    for md_path in sorted(section_dir.rglob("*.md"),
                          key=lambda p: str(p.relative_to(ROOT))):
        process_file(md_path, visited, output_lines)


def generate_language(lang_code):
    """Generate full-content for a given language."""
    config = LANGUAGES[lang_code]
    content = ROOT / config["content_subdir"]
    rules = content / "rules"
    notes = content / "notes"
    out_dir = ROOT / config["out_dir"]

    visited = set()
    output_lines = []

    process_section(rules, visited, output_lines)
    process_section(notes, visited, output_lines)

    out_dir.mkdir(parents=True, exist_ok=True)
    result = "".join(output_lines).strip() + "\n"
    front_matter = f'---\ntitle: "{config["title"]}"\n---\n\n'
    output_path = out_dir / "index.md"
    output_path.write_text(front_matter + result, encoding='utf-8')

    print(f"Generated: {output_path}")
    print(f"Pages included: {len(visited)}")


# === MAIN ===
if len(sys.argv) > 1:
    langs = sys.argv[1:]
else:
    langs = ["fr", "en"]

for lang in langs:
    if lang not in LANGUAGES:
        print(f"Unknown language: {lang}. Available: {', '.join(LANGUAGES.keys())}")
        sys.exit(1)
    print(f"\n--- Generating {lang.upper()} ---")
    generate_language(lang)
