#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HOOKS_DIR="$PROJECT_ROOT/git-hooks"

git -C "$PROJECT_ROOT" config core.hooksPath "$HOOKS_DIR"
echo "Hooks git activés: $HOOKS_DIR"

if ! (command -v asciidoctor-pdf >/dev/null 2>&1 || ruby -S asciidoctor-pdf --version >/dev/null 2>&1); then
    echo "Attention: asciidoctor-pdf n'est pas trouvé. Le hook échouera lors de la régénération des PDF." >&2
    echo "Installez-le avec: gem install asciidoctor-pdf" >&2
fi

if ! command -v pandoc >/dev/null 2>&1; then
    echo "Attention: pandoc n'est pas trouvé. La génération des PDF d'histoires échouera." >&2
    echo "Installez-le avec: sudo apt install pandoc" >&2
fi

if ! command -v python3 >/dev/null 2>&1; then
    echo "Attention: python3 n'est pas trouvé. La génération des PDF d'histoires échouera." >&2
fi
