#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

STORY_SLUG="${1:-}"
STORY_LANG="${2:-fr}"

if [ -z "$STORY_SLUG" ]; then
    echo "Usage: $0 <slug> [lang]" >&2
    echo "Slugs: la-voie-lunaire, les-heritiers-de-zola-fel" >&2
    exit 1
fi

case "$STORY_SLUG" in
    la-voie-lunaire|les-heritiers-de-zola-fel) ;;
    *) echo "Error: slug d'histoire non reconnu: $STORY_SLUG" >&2; exit 1 ;;
esac

case "$STORY_LANG" in
    fr|en) ;;
    *) echo "Error: langue non supportée: $STORY_LANG (utiliser fr ou en)" >&2; exit 1 ;;
esac

STORY_DIR="$PROJECT_ROOT/content/${STORY_LANG}/stories/${STORY_SLUG}"
THEME="$SCRIPT_DIR/srd-pdf-theme.yml"
BUILDER="$SCRIPT_DIR/story-pdf.py"

if [ ! -d "$STORY_DIR" ]; then
    echo "Error: $STORY_DIR introuvable" >&2
    exit 1
fi

mkdir -p "$STORY_DIR"
ADOC="$STORY_DIR/.${STORY_SLUG}.adoc"
OUT="$STORY_DIR/${STORY_SLUG}.pdf"

cleanup() { rm -f "$ADOC"; }
trap cleanup EXIT

python3 "$BUILDER" "$STORY_SLUG" "$STORY_LANG" > "$ADOC"

ruby -S asciidoctor-pdf \
    -a pdf-theme="$THEME" \
    -o "$OUT" "$ADOC"

echo "PDF generated: $OUT ($(du -h "$OUT" | cut -f1))"
