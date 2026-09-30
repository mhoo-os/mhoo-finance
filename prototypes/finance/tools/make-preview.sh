#!/usr/bin/env bash
# Wrap the artifact-style index.html (no doctype/html/head/body) in the skeleton the artifact
# host adds, writing the gitignored preview.html next to it. Usage: bash tools/make-preview.sh
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$DIR/index.html"; OUT="$DIR/preview.html"
if grep -Eiq '<!doctype|<html[ >]|<head[ >]|<body[ >]|</body>|</html>' "$SRC"; then
  echo "make-preview: index.html must not contain doctype/html/head/body tags" >&2; exit 1
fi
{
  printf '%s' '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui,sans-serif;background:#fafafa}[hidden]{display:none!important}</style></head><body>'
  cat "$SRC"
  printf '%s\n' '</body></html>'
} > "$OUT"
echo "$OUT"
