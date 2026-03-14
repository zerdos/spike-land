#!/usr/bin/env bash
# dev-full.sh — Start all local dev services + Cloudflare Tunnel
#
# Extends dev-local.sh with:
#   - cloudflared tunnel (exposes Workers under *.spike.land subdomains)
#   - spike-web Astro dev server (local.spike.land proxies to edge at 8787)
#
# Prerequisites:
#   1. cloudflared installed: brew install cloudflare/cloudflare/cloudflared
#   2. Tunnel created once:   yarn tunnel:setup
#   3. Credentials file:      ~/.cloudflared/spike-land-dev.json
#
# Usage:
#   bash scripts/dev-full.sh [--no-sync] [--no-tunnel] [--no-web]
#
# All three Workers can also be started independently:
#   yarn dev:edge | yarn dev:mcp | yarn dev:auth

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TUNNEL_CONFIG="${REPO_ROOT}/tunnel.yml"

# ─── Colours (skip if not a TTY) ─────────────────────────────────────────────
if [ -t 1 ]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  CYAN='\033[0;36m'
  MAGENTA='\033[0;35m'
  BLUE='\033[0;34m'
  WHITE='\033[1;37m'
  BOLD='\033[1m'
  RESET='\033[0m'
else
  RED='' GREEN='' YELLOW='' CYAN='' MAGENTA='' BLUE='' WHITE='' BOLD='' RESET=''
fi

# ─── Defaults ────────────────────────────────────────────────────────────────
SYNC=true
WITH_TUNNEL=true
WITH_WEB=true

# ─── Argument parsing ────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-sync)    SYNC=false;       shift ;;
    --no-tunnel)  WITH_TUNNEL=false; shift ;;
    --no-web)     WITH_WEB=false;   shift ;;
    -h|--help)
      echo "Usage: bash scripts/dev-full.sh [--no-sync] [--no-tunnel] [--no-web]"
      echo ""
      echo "Services started:"
      echo "  spike-web       → http://localhost:4321"
      echo "  spike-edge      → http://localhost:8787"
      echo "  spike-land-mcp  → http://localhost:8790"
      echo "  mcp-auth        → http://localhost:8791"
      echo "  cloudflared     → https://local.spike.land / local-mcp / local-auth"
      exit 0
      ;;
    *) echo -e "${RED}Unknown option: $1${RESET}"; exit 1 ;;
  esac
done

# ─── Guards ──────────────────────────────────────────────────────────────────
if $WITH_TUNNEL; then
  if ! command -v cloudflared &>/dev/null; then
    echo -e "${RED}cloudflared not found. Install with: brew install cloudflare/cloudflare/cloudflared${RESET}"
    echo -e "${YELLOW}Re-run with --no-tunnel to skip the tunnel.${RESET}"
    exit 1
  fi
  if [[ ! -f "${TUNNEL_CONFIG}" ]]; then
    echo -e "${RED}tunnel.yml not found at ${TUNNEL_CONFIG}${RESET}"
    echo -e "${YELLOW}Run: yarn tunnel:setup  (once, requires cloudflared login)${RESET}"
    exit 1
  fi
  CREDS_FILE=$(grep 'credentials-file:' "${TUNNEL_CONFIG}" | awk '{print $2}' | sed "s|~|${HOME}|")
  if [[ ! -f "${CREDS_FILE}" ]]; then
    echo -e "${RED}Tunnel credentials not found at ${CREDS_FILE}${RESET}"
    echo -e "${YELLOW}Run: yarn tunnel:setup  to create the tunnel and credentials${RESET}"
    exit 1
  fi
fi

# ─── Process tracking ────────────────────────────────────────────────────────
CHILD_PIDS=()

cleanup() {
  echo ""
  echo -e "${BOLD}Shutting down all services...${RESET}"
  for pid in "${CHILD_PIDS[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill -TERM "$pid" 2>/dev/null
    fi
  done
  # Give processes up to 5 s to exit cleanly before force-killing
  local deadline=$((SECONDS + 5))
  while [[ $SECONDS -lt $deadline ]]; do
    local alive=0
    for pid in "${CHILD_PIDS[@]}"; do
      kill -0 "$pid" 2>/dev/null && alive=1
    done
    [[ $alive -eq 0 ]] && break
    sleep 0.5
  done
  for pid in "${CHILD_PIDS[@]}"; do
    kill -KILL "$pid" 2>/dev/null || true
  done
  echo -e "${GREEN}All services stopped.${RESET}"
}
trap cleanup SIGINT SIGTERM EXIT

# ─── Helpers ─────────────────────────────────────────────────────────────────
check_port() {
  local port=$1 name=$2
  local pid
  pid=$(lsof -ti :"$port" 2>/dev/null | head -1)
  if [[ -n "$pid" ]]; then
    echo -e "${YELLOW}  Port $port already in use (PID $pid) — skipping $name${RESET}"
    return 1
  fi
  return 0
}

start_bg() {
  # start_bg <label> <color> <workdir> <cmd...>
  local label=$1 color=$2 workdir=$3
  shift 3
  local pad
  pad=$(printf '%-16s' "$label")
  (cd "$workdir" && exec "$@" 2>&1) \
    | awk -v p="${color}[${pad}]${RESET} " '{print p $0}' &
  local pid=$!
  CHILD_PIDS+=("$pid")
  echo -e "${color}  Started ${label} (PID ${pid})${RESET}"
}

# ─── Phase 1: Git Sync ───────────────────────────────────────────────────────
if $SYNC; then
  echo -e "${BOLD}── Git Sync ──────────────────────────────────────${RESET}"
  CHANGES=$(git -C "$REPO_ROOT" status --porcelain 2>/dev/null | wc -l | tr -d ' ')
  if [[ "$CHANGES" -gt 0 ]]; then
    echo -e "${YELLOW}  $CHANGES uncommitted change(s) — skipping pull${RESET}"
  else
    if git -C "$REPO_ROOT" pull --rebase --autostash 2>/dev/null; then
      echo -e "${GREEN}  git pull --rebase OK${RESET}"
    else
      echo -e "${YELLOW}  git pull failed (continuing anyway)${RESET}"
    fi
  fi
  echo ""
fi

# ─── Phase 2: Start Workers ──────────────────────────────────────────────────
echo -e "${BOLD}── Starting Cloudflare Workers ───────────────────${RESET}"

if check_port 8787 "spike-edge"; then
  start_bg "spike-edge" "$GREEN" "${REPO_ROOT}/packages/spike-edge" \
    npx wrangler dev --port 8787 --inspector-port 9230
fi

if check_port 8790 "spike-land-mcp"; then
  start_bg "spike-land-mcp" "$YELLOW" "${REPO_ROOT}/packages/spike-land-mcp" \
    npx wrangler dev --port 8790 --inspector-port 9231
fi

if check_port 8791 "mcp-auth"; then
  start_bg "mcp-auth" "$MAGENTA" "${REPO_ROOT}/packages/mcp-auth" \
    npx wrangler dev --port 8791 --inspector-port 9232
fi

# Brief pause — wrangler needs a moment to bind ports before the tunnel
# tries to proxy to them; avoids a burst of 502s in the tunnel log.
sleep 3

# ─── Phase 3: Cloudflare Tunnel ──────────────────────────────────────────────
if $WITH_TUNNEL; then
  echo ""
  echo -e "${BOLD}── Starting Cloudflare Tunnel ────────────────────${RESET}"
  start_bg "cloudflared" "$CYAN" "$REPO_ROOT" \
    cloudflared tunnel --config "${TUNNEL_CONFIG}" run
fi

# ─── Phase 4: Astro / spike-web ──────────────────────────────────────────────
if $WITH_WEB; then
  echo ""
  echo -e "${BOLD}── Starting spike-web (Astro) ────────────────────${RESET}"
  if check_port 4321 "spike-web"; then
    start_bg "spike-web" "$BLUE" "${REPO_ROOT}/packages/spike-web" \
      npx astro dev
  fi
fi

# ─── Phase 5: Status Banner ──────────────────────────────────────────────────
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║             spike-land-ai  dev stack             ║${RESET}"
echo -e "${BOLD}╠══════════════════════════════════════════════════╣${RESET}"
echo -e "${BOLD}║  Local                                           ║${RESET}"
printf "${BOLD}║${RESET}  ${GREEN}%-14s${RESET} → http://localhost:%-5s        ${BOLD}║${RESET}\n" "spike-edge"     "8787"
printf "${BOLD}║${RESET}  ${YELLOW}%-14s${RESET} → http://localhost:%-5s        ${BOLD}║${RESET}\n" "spike-land-mcp" "8790"
printf "${BOLD}║${RESET}  ${MAGENTA}%-14s${RESET} → http://localhost:%-5s        ${BOLD}║${RESET}\n" "mcp-auth"       "8791"
printf "${BOLD}║${RESET}  ${BLUE}%-14s${RESET} → http://localhost:%-5s        ${BOLD}║${RESET}\n" "spike-web"      "4321"
if $WITH_TUNNEL; then
echo -e "${BOLD}╠══════════════════════════════════════════════════╣${RESET}"
echo -e "${BOLD}║  Tunnel (public HTTPS)                           ║${RESET}"
printf "${BOLD}║${RESET}  ${CYAN}%-14s${RESET} → https://local.spike.land      ${BOLD}║${RESET}\n" "edge"
printf "${BOLD}║${RESET}  ${CYAN}%-14s${RESET} → https://local-mcp.spike.land  ${BOLD}║${RESET}\n" "mcp"
printf "${BOLD}║${RESET}  ${CYAN}%-14s${RESET} → https://local-auth.spike.land ${BOLD}║${RESET}\n" "auth"
fi
echo -e "${BOLD}╠══════════════════════════════════════════════════╣${RESET}"
echo -e "${BOLD}║  Inspectors                                      ║${RESET}"
printf "${BOLD}║${RESET}  ${GREEN}%-14s${RESET} → http://localhost:9230         ${BOLD}║${RESET}\n" "edge inspector"
printf "${BOLD}║${RESET}  ${YELLOW}%-14s${RESET} → http://localhost:9231         ${BOLD}║${RESET}\n" "mcp inspector"
printf "${BOLD}║${RESET}  ${MAGENTA}%-14s${RESET} → http://localhost:9232         ${BOLD}║${RESET}\n" "auth inspector"
echo -e "${BOLD}╚══════════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "${WHITE}Press Ctrl+C to stop all services${RESET}"
echo ""

# ─── Phase 6: Monitor ────────────────────────────────────────────────────────
while true; do
  for idx in "${!CHILD_PIDS[@]}"; do
    pid="${CHILD_PIDS[$idx]}"
    if ! kill -0 "$pid" 2>/dev/null; then
      wait "$pid" 2>/dev/null
      code=$?
      if [[ $code -ne 0 ]]; then
        echo -e "${RED}  Service (PID $pid) exited with code $code${RESET}"
      fi
      unset 'CHILD_PIDS[$idx]'
    fi
  done
  if [[ ${#CHILD_PIDS[@]} -eq 0 ]]; then
    echo -e "${YELLOW}All services have exited.${RESET}"
    break
  fi
  sleep 2
done
