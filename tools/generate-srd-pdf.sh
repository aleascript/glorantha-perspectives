#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SRD_LANG="${1:-fr}"

SRC="$PROJECT_ROOT/srd/glorantha-perspectives-${SRD_LANG}.adoc"
OUT_DIR="$PROJECT_ROOT/content/${SRD_LANG}/srd"
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
OUT="$OUT_DIR/glorantha-perspectives-${SRD_LANG}-${VERSION}.pdf"

ruby -S asciidoctor-pdf \
    -a pdf-theme="$THEME" \
    -o "$OUT" "$SRC"

if compgen -G "$OUT_DIR/glorantha-perspectives-${SRD_LANG}-*.pdf" >/dev/null; then
    for old in "$OUT_DIR"/glorantha-perspectives-"${SRD_LANG}"-*.pdf; do
        if [ "$old" != "$OUT" ]; then
            rm -f "$old"
            echo "Removed old version: $old"
        fi
    done
fi

echo "PDF generated: $OUT ($(du -h "$OUT" | cut -f1))"
