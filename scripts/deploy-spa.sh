#!/usr/bin/env bash
set -euo pipefail

# Deploy spike-web Astro SPA to R2 bucket (spike-app-assets) for serving via spike-edge.
# Usage: bash scripts/deploy-spa.sh
# Called from: packages/spike-web/package.json "deploy" script

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SPA_DIR="$ROOT_DIR/packages/spike-web"
DIST_DIR="$SPA_DIR/dist"
BUCKET="spike-app-assets"
WRANGLER="$ROOT_DIR/node_modules/.bin/wrangler"

if [ ! -f "$WRANGLER" ]; then
  WRANGLER="$(which wrangler 2>/dev/null || echo "npx wrangler")"
fi

echo "==> spike-web SPA deploy to R2 bucket: $BUCKET"
echo "==> DIST_DIR: $DIST_DIR"

if [ ! -d "$DIST_DIR" ]; then
  echo "ERROR: dist/ not found. Run 'npm run build' in packages/spike-web first."
  exit 1
fi

# Inject build metadata into index.html
BUILD_SHA=$(git -C "$ROOT_DIR" log -1 --format=%H HEAD 2>/dev/null || echo "unknown")
BUILD_TIME=$(git -C "$ROOT_DIR" log -1 --format=%cI HEAD 2>/dev/null || echo "unknown")
INDEX_HTML="$DIST_DIR/index.html"
if [ -f "$INDEX_HTML" ]; then
  # BSD sed (macOS) requires -i '' while GNU sed (Linux) allows -i directly
  if sed --version >/dev/null 2>&1; then
    sed -i "s|</head>|<meta name=\"build-sha\" content=\"${BUILD_SHA}\" /><meta name=\"build-time\" content=\"${BUILD_TIME}\" /></head>|" "$INDEX_HTML"
  else
    sed -i '' "s|</head>|<meta name=\"build-sha\" content=\"${BUILD_SHA}\" /><meta name=\"build-time\" content=\"${BUILD_TIME}\" /></head>|" "$INDEX_HTML"
  fi
  echo "==> Injected build SHA: ${BUILD_SHA:0:8} into index.html"
fi

echo "==> Uploading dist/ to R2..."
WRANGLER="$WRANGLER" UPLOAD_HTML_LAST=1 bash "$SCRIPT_DIR/upload-to-r2.sh" "$DIST_DIR" "$BUCKET"

echo ""
echo "==> SPA deployed to R2 bucket: $BUCKET"
echo "==> spike-edge serves this via its R2 binding (spike-app-assets bucket)."
