#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HOOKS_DIR="$PROJECT_ROOT/git-hooks"

git -C "$PROJECT_ROOT" config core.hooksPath "$HOOKS_DIR"
echo "Hooks git activés: $HOOKS_DIR"

if ! (command -v asciidoctor-pdf >/dev/null 2>&1 || ruby -S asciidoctor-pdf --version >/dev/null 2>&1); then
    echo "Attention: asciidoctor-pdf n'est pas trouvé. Le hook échouera lors de la régénération." >&2
    echo "Installez-le avec: gem install asciidoctor-pdf" >&2
fi
