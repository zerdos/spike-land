#!/usr/bin/env bash
# detect-changed-packages.sh
# Detects which packages have changed between two git refs and outputs
# the list of package names (as known to vitest.config.ts --project flags).
#
# Usage:
#   bash scripts/detect-changed-packages.sh [--base <ref>] [--head <ref>]
#
# Outputs one package name per line to stdout, or the special tokens:
#   ALL         – run all test suites
#   NO_CHANGES  – nothing test-relevant changed

set -euo pipefail

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------
BASE_REF="origin/main"
HEAD_REF="HEAD"

# ---------------------------------------------------------------------------
# Arg parsing
# ---------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --base)  BASE_REF="$2"; shift 2 ;;
    --head)  HEAD_REF="$2"; shift 2 ;;
    *)       echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

# ---------------------------------------------------------------------------
# Package path map:  package-name → src sub-path (relative to repo root)
# ---------------------------------------------------------------------------
declare -A PKG_TO_PATH
PKG_TO_PATH["bazdmeg-mcp"]="src/mcp-tools/bazdmeg"
PKG_TO_PATH["block-sdk"]="src/core/block-sdk"
PKG_TO_PATH["block-tasks"]="src/core/block-tasks"
PKG_TO_PATH["block-website"]="src/core/block-website"
PKG_TO_PATH["chess-engine"]="src/core/chess"
PKG_TO_PATH["code"]="src/frontend/monaco-editor"
PKG_TO_PATH["esbuild-wasm-mcp"]="src/mcp-tools/esbuild-wasm"
PKG_TO_PATH["google-analytics-mcp"]="src/mcp-tools/google-analytics"
PKG_TO_PATH["google-ads-mcp"]="src/mcp-tools/google-ads"
PKG_TO_PATH["hackernews-mcp"]="src/mcp-tools/hackernews"
PKG_TO_PATH["image-studio-worker"]="src/edge-api/image-studio-worker"
PKG_TO_PATH["mcp-auth"]="src/edge-api/auth"
PKG_TO_PATH["mcp-image-studio"]="src/mcp-tools/image-studio"
PKG_TO_PATH["mcp-server-base"]="src/core/server-base"
PKG_TO_PATH["openclaw-mcp"]="src/mcp-tools/openclaw"
PKG_TO_PATH["qa-studio"]="src/core/browser-automation"
PKG_TO_PATH["react-ts-worker"]="src/core/react-engine"
PKG_TO_PATH["shared"]="src/core/shared-utils"
PKG_TO_PATH["spike-app"]="src/frontend/platform-frontend"
PKG_TO_PATH["spike-cli"]="src/cli/spike-cli"
PKG_TO_PATH["spike-edge"]="src/edge-api/main"
PKG_TO_PATH["spike-chat"]="src/edge-api/spike-chat"
PKG_TO_PATH["spike-land-backend"]="src/edge-api/backend"
PKG_TO_PATH["spike-land-mcp"]="src/edge-api/spike-land"
PKG_TO_PATH["spike-review"]="src/mcp-tools/code-review"
PKG_TO_PATH["stripe-analytics-mcp"]="src/mcp-tools/stripe-analytics"
PKG_TO_PATH["state-machine"]="src/core/statecharts"
PKG_TO_PATH["transpile"]="src/edge-api/transpile"
PKG_TO_PATH["vibe-dev"]="src/cli/docker-dev"
PKG_TO_PATH["video"]="src/media/educational-videos"
PKG_TO_PATH["whatsapp-mcp"]="src/utilities/whatsapp"

TOTAL_PACKAGES=${#PKG_TO_PATH[@]}

# Packages that use react (shared react-engine consumers).
# If react-engine changes, all of these also need testing.
REACT_CONSUMERS=(
  "code"
  "spike-app"
  "spike-land-backend"
  "transpile"
  "spike-land-mcp"
  "spike-edge"
  "spike-chat"
)

# ---------------------------------------------------------------------------
# Build reverse map: src-path-prefix → package-name
# We strip the leading "src/" so we can match against "src/<category>/<pkg>".
# ---------------------------------------------------------------------------
declare -A PATH_TO_PKG
for pkg in "${!PKG_TO_PATH[@]}"; do
  PATH_TO_PKG["${PKG_TO_PATH[$pkg]}"]="$pkg"
done

# ---------------------------------------------------------------------------
# Get changed files
# ---------------------------------------------------------------------------
REPO_ROOT="$(git -C "$(dirname "$0")/.." rev-parse --show-toplevel 2>/dev/null || echo "$(pwd)")"

changed_files=$(git -C "$REPO_ROOT" diff --name-only "$BASE_REF" "$HEAD_REF" 2>/dev/null) || {
  echo "ERROR: git diff failed (base=$BASE_REF head=$HEAD_REF)" >&2
  exit 0
}

if [[ -z "$changed_files" ]]; then
  echo "NO_CHANGES"
  exit 0
fi

# ---------------------------------------------------------------------------
# Decision: declare ALL early on config-level changes
# ---------------------------------------------------------------------------
declare -A affected   # package-name → 1

all_packages=false

while IFS= read -r f; do
  # Global config triggers
  case "$f" in
    .tests/vitest.config.ts | package.json | yarn.lock | .yarnrc.yml)
      all_packages=true
      break
      ;;
  esac
done <<< "$changed_files"

if $all_packages; then
  echo "ALL"
  exit 0
fi

# ---------------------------------------------------------------------------
# Map each changed file to a package
# ---------------------------------------------------------------------------
while IFS= read -r f; do
  # .tests/<pkg>/ directory
  if [[ "$f" == .tests/* ]]; then
    # .tests/vitest.config.ts already handled above; remaining: .tests/<pkg>/...
    subpath="${f#.tests/}"
    pkg_candidate="${subpath%%/*}"
    if [[ -n "$pkg_candidate" && -v "PKG_TO_PATH[$pkg_candidate]" ]]; then
      affected["$pkg_candidate"]=1
    fi
    continue
  fi

  # src/<category>/<package-subdir>/... files
  if [[ "$f" == src/* ]]; then
    # Try longest-prefix match (up to 3 path components: src/cat/pkg)
    # Build candidate: src/<cat>/<pkg>
    IFS='/' read -ra parts <<< "$f"
    # parts[0]=src, parts[1]=category, parts[2]=pkg-dir
    if [[ ${#parts[@]} -ge 3 ]]; then
      candidate="src/${parts[1]}/${parts[2]}"
      if [[ -v "PATH_TO_PKG[$candidate]" ]]; then
        pkg="${PATH_TO_PKG[$candidate]}"

        # Special case: shared triggers ALL
        if [[ "$pkg" == "shared" ]]; then
          all_packages=true
          break
        fi

        # Special case: react-engine → add react-ts-worker + all react consumers
        if [[ "$pkg" == "react-ts-worker" ]]; then
          affected["react-ts-worker"]=1
          for consumer in "${REACT_CONSUMERS[@]}"; do
            affected["$consumer"]=1
          done
          continue
        fi

        affected["$pkg"]=1
      else
        echo "WARNING: no package mapping for changed path: $f" >&2
      fi
    else
      echo "WARNING: unexpected src path (too short): $f" >&2
    fi
    continue
  fi

  # Anything else: not in src/ and not special → ignore silently

done <<< "$changed_files"

# Check if shared triggered ALL during the loop
if $all_packages; then
  echo "ALL"
  exit 0
fi

# ---------------------------------------------------------------------------
# >80% of packages affected → just run ALL
# ---------------------------------------------------------------------------
num_affected=${#affected[@]}

if [[ $TOTAL_PACKAGES -gt 0 ]]; then
  threshold=$(( (TOTAL_PACKAGES * 80 + 99) / 100 ))   # ceiling division
  if [[ $num_affected -ge $threshold ]]; then
    echo "ALL"
    exit 0
  fi
fi

# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------
if [[ $num_affected -eq 0 ]]; then
  echo "NO_CHANGES"
  exit 0
fi

for pkg in "${!affected[@]}"; do
  echo "$pkg"
done | sort -u

exit 0
