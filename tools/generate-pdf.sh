#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
INPUT="$PROJECT_ROOT/full-content.md"
OUTPUT="$PROJECT_ROOT/full-content.pdf"
CSS="$SCRIPT_DIR/pdf-style.css"

if [ ! -f "$INPUT" ]; then
    echo "Erreur: $INPUT introuvable. Lance d'abord generate-full-content.sh" >&2
    exit 1
fi

# Generate CSS if missing
if [ ! -f "$CSS" ]; then
    cat > "$CSS" << 'CSS'
@page {
    size: A4;
    margin: 2cm 2.5cm;
    @bottom-center {
        content: counter(page);
        font-size: 9pt;
        color: #888;
    }
}

body {
    font-family: "DejaVu Serif", Georgia, "Times New Roman", serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #1a1a1a;
    max-width: 100%;
}

h1 {
    font-size: 20pt;
    color: #2c3e50;
    border-bottom: 2px solid #2c3e50;
    padding-bottom: 6pt;
    margin-top: 2em;
    page-break-before: always;
}

h1:first-of-type {
    page-break-before: avoid;
}

h2 {
    font-size: 15pt;
    color: #34495e;
    margin-top: 1.5em;
}

h3 {
    font-size: 12pt;
    color: #555;
    margin-top: 1.2em;
}

blockquote {
    border-left: 3px solid #7f8c8d;
    margin: 1em 0;
    padding: 0.5em 1em;
    background: #f9f9f9;
    color: #333;
    font-style: italic;
}

blockquote p {
    margin: 0.3em 0;
}

hr {
    border: none;
    border-top: 1px solid #ddd;
    margin: 1.5em 0;
}

table {
    border-collapse: collapse;
    width: 100%;
    margin: 1em 0;
    font-size: 10pt;
}

th, td {
    border: 1px solid #ccc;
    padding: 6pt 10pt;
    text-align: left;
}

th {
    background: #ecf0f1;
    font-weight: bold;
}

img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 1em auto;
}

code {
    font-family: "DejaVu Sans Mono", monospace;
    font-size: 9.5pt;
    background: #f4f4f4;
    padding: 1pt 3pt;
    border-radius: 2pt;
}

pre {
    background: #f4f4f4;
    padding: 10pt;
    border-radius: 4pt;
    overflow-x: auto;
    font-size: 9pt;
}

ul, ol {
    padding-left: 1.5em;
}

li {
    margin-bottom: 0.3em;
}

strong {
    color: #2c3e50;
}

a {
    color: #2980b9;
    text-decoration: none;
}
CSS
    echo "CSS créé: $CSS"
fi

# Step 1: Markdown → HTML with pandoc
HTML=$(mktemp /tmp/full-content-XXXXX.html)
trap "rm -f $HTML" EXIT

pandoc "$INPUT" \
    --from markdown \
    --to html5 \
    --standalone \
    --metadata title="Glorantha Perspectives" \
    --css="$CSS" \
    --embed-resources \
    --output="$HTML"

echo "HTML généré: $HTML"

# Step 2: HTML → PDF with weasyprint
weasyprint "$HTML" "$OUTPUT" --stylesheet "$CSS"

echo "PDF généré: $OUTPUT"
echo "Taille: $(du -h "$OUTPUT" | cut -f1)"
