#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LANG="${1:-fr}"

SRC="$PROJECT_ROOT/srd/glorantha-perspectives-${LANG}.adoc"
OUT_DIR="$PROJECT_ROOT/content/${LANG}/srd"
THEME="$SCRIPT_DIR/srd-pdf-theme.yml"

if [ ! -f "$SRC" ]; then
    echo "Error: $SRC not found" >&2
    exit 1
fi

VERSION="$(grep -m1 '^:revnumber:' "$SRC" | sed -E 's/^:revnumber:[[:space:]]*//' | tr -d '[:space:]')"
if [ -z "$VERSION" ]; then
    echo "Error: :revnumber: not found in $SRC" >&2
    exit 1
fi

mkdir -p "$OUT_DIR"
OUT="$OUT_DIR/glorantha-perspectives-${LANG}-${VERSION}.pdf"

ruby -S asciidoctor-pdf \
    -a pdf-theme="$THEME" \
    -o "$OUT" "$SRC"

echo "PDF generated: $OUT ($(du -h "$OUT" | cut -f1))"
