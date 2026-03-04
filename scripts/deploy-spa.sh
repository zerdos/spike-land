#!/usr/bin/env bash
set -euo pipefail

# Deploy spike-app SPA to R2 bucket for serving via spike-edge
# Usage: bash scripts/deploy-spa.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SPA_DIR="$ROOT_DIR/src/spike-app"
BUCKET="spike-app-assets"

echo "==> Building spike-app..."
cd "$SPA_DIR"
npm run build

DIST_DIR="$SPA_DIR/dist"

if [ ! -d "$DIST_DIR" ]; then
  echo "ERROR: dist/ directory not found after build"
  exit 1
fi

echo "==> Uploading to R2 bucket: $BUCKET"

# Map file extensions to content types
get_content_type() {
  case "$1" in
    *.html) echo "text/html; charset=utf-8" ;;
    *.js)   echo "application/javascript; charset=utf-8" ;;
    *.mjs)  echo "application/javascript; charset=utf-8" ;;
    *.css)  echo "text/css; charset=utf-8" ;;
    *.json) echo "application/json; charset=utf-8" ;;
    *.svg)  echo "image/svg+xml" ;;
    *.png)  echo "image/png" ;;
    *.jpg|*.jpeg) echo "image/jpeg" ;;
    *.ico)  echo "image/x-icon" ;;
    *.woff) echo "font/woff" ;;
    *.woff2) echo "font/woff2" ;;
    *.ttf)  echo "font/ttf" ;;
    *.wasm) echo "application/wasm" ;;
    *.map)  echo "application/json" ;;
    *.txt)  echo "text/plain" ;;
    *)      echo "application/octet-stream" ;;
  esac
}

# Upload all files from dist/
find "$DIST_DIR" -type f | while read -r file; do
  # Get relative path for key
  key="${file#$DIST_DIR/}"
  content_type=$(get_content_type "$file")

  echo "  Uploading: $key ($content_type)"
  npx wrangler r2 object put "$BUCKET/$key" \
    --file "$file" \
    --content-type "$content_type" \
    --remote || {
      echo "ERROR: Failed to upload $key"
      exit 1
    }
done

echo ""
echo "==> SPA uploaded to R2 bucket: $BUCKET"
echo "==> Deploy spike-edge to serve SPA:"
echo "    cd src/spike-edge && npm run deploy"
