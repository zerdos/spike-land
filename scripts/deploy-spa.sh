#!/usr/bin/env bash
set -euo pipefail

# Deploy spike-app SPA to R2 bucket for serving via spike-edge
# Usage: bash scripts/deploy-spa.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SPA_DIR="$ROOT_DIR/packages/spike-web"
BUCKET="spike-app-assets"

echo "==> Note: Assuming spike-web has already been built."
DIST_DIR="$ROOT_DIR/packages/spike-web/dist"

if [ ! -d "$DIST_DIR" ]; then
  echo "ERROR: dist/ directory not found after build"
  exit 1
fi

# Inject build metadata into index.html
BUILD_SHA=$(git -C "$ROOT_DIR" log -1 --format=%H HEAD 2>/dev/null || echo "unknown")
BUILD_TIME=$(git -C "$ROOT_DIR" log -1 --format=%cI HEAD 2>/dev/null || echo "unknown")
INDEX_HTML="$DIST_DIR/index.html"
if [ -f "$INDEX_HTML" ]; then
  # Portable sed -i: works on both macOS (BSD sed) and Linux (GNU sed)
  if sed --version >/dev/null 2>&1; then
    sed -i "s|</head>|<meta name=\"build-sha\" content=\"${BUILD_SHA}\" /><meta name=\"build-time\" content=\"${BUILD_TIME}\" /></head>|" "$INDEX_HTML"
  else
    sed -i '' "s|</head>|<meta name=\"build-sha\" content=\"${BUILD_SHA}\" /><meta name=\"build-time\" content=\"${BUILD_TIME}\" /></head>|" "$INDEX_HTML"
  fi
  echo "==> Injected build SHA: ${BUILD_SHA:0:8}"
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
    *.xml)  echo "application/xml" ;;
    *.webmanifest) echo "application/manifest+json" ;;
    *.wasm) echo "application/wasm" ;;
    *.map)  echo "application/json" ;;
    *.txt)  echo "text/plain" ;;
    *)      echo "application/octet-stream" ;;
  esac
}

# Upload all files from dist/ (sequential to avoid subshell PID issues)
upload_count=0
upload_errors=0
while IFS= read -r file; do
  key="${file#$DIST_DIR/}"
  content_type=$(get_content_type "$file")

  echo "Uploading: $key ($content_type)"
  if npx wrangler r2 object put "$BUCKET/$key" \
    --file "$file" \
    --content-type "$content_type" \
    --remote; then
    upload_count=$((upload_count + 1))
  else
    echo "ERROR: Failed to upload $key"
    upload_errors=$((upload_errors + 1))
  fi
done < <(find "$DIST_DIR" -type f)

if [ "$upload_errors" -gt 0 ]; then
  echo "ERROR: $upload_errors file(s) failed to upload"
  exit 1
fi
echo "==> Uploaded $upload_count file(s) successfully"

echo ""
echo "==> SPA uploaded to R2 bucket: $BUCKET"
echo "==> Deploy spike-edge to serve SPA:"
echo "    cd src/spike-edge && npm run deploy"
