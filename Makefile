# spike-land-ai — Bulk operations across all repos
#
# Usage:
#   make build-all     Build in dependency order
#   make test-all      Run all tests
#   make lint-all      Run all linters
#   make link-all      npm link in dependency order (for local dev)
#   make check-all     lint + typecheck + test everything

SHELL := /bin/bash
ROOT := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))

# Repos with no internal @spike-land-ai deps (can build in parallel)
LEAF_REPOS := hackernews-mcp mcp-pixel openclaw-mcp spike-review vibe-dev video

# Build order: topologically sorted by dependency-map.json
# Layer 0: no internal deps
L0 := shared esbuild-wasm
# Layer 1: depends on L0
L1 := esbuild-wasm-mcp react-ts-worker spike-cli
# Layer 2: depends on L0+L1
L2 := code
# Layer 3: depends on L0+L1+L2
L3 := transpile spike-land-backend
# Layer 4: depends on everything
L4 := spike.land

ALL_REPOS := $(LEAF_REPOS) $(L0) $(L1) $(L2) $(L3) $(L4)

# ─── Build ────────────────────────────────────────────────────
.PHONY: build-all build-leaves build-l0 build-l1 build-l2 build-l3 build-l4

build-all: build-leaves build-l0 build-l1 build-l2 build-l3 build-l4
	@echo "✓ All repos built successfully"

build-leaves:
	@for dir in $(LEAF_REPOS); do \
		if [ -f "$(ROOT)$$dir/package.json" ]; then \
			echo "Building $$dir..."; \
			cd "$(ROOT)$$dir" && npm run build 2>/dev/null || true; \
		fi; \
	done

build-l0:
	@for dir in $(L0); do \
		echo "Building $$dir..."; \
		cd "$(ROOT)$$dir" && npm run build; \
	done

build-l1:
	@for dir in $(L1); do \
		echo "Building $$dir..."; \
		cd "$(ROOT)$$dir" && npm run build; \
	done

build-l2:
	@for dir in $(L2); do \
		echo "Building $$dir..."; \
		cd "$(ROOT)$$dir" && npm run build; \
	done

build-l3:
	@for dir in $(L3); do \
		echo "Building $$dir..."; \
		cd "$(ROOT)$$dir" && npm run build; \
	done

build-l4:
	@echo "Building spike.land..."
	@cd "$(ROOT)spike.land" && yarn build

# ─── Test ─────────────────────────────────────────────────────
.PHONY: test-all

test-all:
	@failed=0; \
	for dir in $(ALL_REPOS); do \
		if [ -f "$(ROOT)$$dir/package.json" ]; then \
			echo "Testing $$dir..."; \
			if [ "$$dir" = "spike.land" ]; then \
				(cd "$(ROOT)$$dir" && yarn test) || failed=$$((failed + 1)); \
			else \
				(cd "$(ROOT)$$dir" && npm test) || failed=$$((failed + 1)); \
			fi; \
		fi; \
	done; \
	if [ $$failed -gt 0 ]; then \
		echo "✗ $$failed repo(s) had test failures"; exit 1; \
	else \
		echo "✓ All tests passed"; \
	fi

# ─── Lint ─────────────────────────────────────────────────────
.PHONY: lint-all

lint-all:
	@failed=0; \
	for dir in $(ALL_REPOS); do \
		if [ -f "$(ROOT)$$dir/package.json" ]; then \
			echo "Linting $$dir..."; \
			if [ "$$dir" = "spike.land" ]; then \
				(cd "$(ROOT)$$dir" && yarn lint) || failed=$$((failed + 1)); \
			else \
				(cd "$(ROOT)$$dir" && npm run lint) || failed=$$((failed + 1)); \
			fi; \
		fi; \
	done; \
	if [ $$failed -gt 0 ]; then \
		echo "✗ $$failed repo(s) had lint failures"; exit 1; \
	else \
		echo "✓ All lint checks passed"; \
	fi

# ─── Link (local dev) ────────────────────────────────────────
.PHONY: link-all

link-all:
	@echo "Linking Layer 0: $(L0)"
	@for dir in $(L0); do \
		cd "$(ROOT)$$dir" && npm link; \
	done
	@echo "Linking Layer 1: $(L1)"
	@for dir in $(L1); do \
		cd "$(ROOT)$$dir" && npm link @spike-land-ai/esbuild-wasm 2>/dev/null || true; \
		cd "$(ROOT)$$dir" && npm link @spike-land-ai/shared 2>/dev/null || true; \
		cd "$(ROOT)$$dir" && npm link; \
	done
	@echo "Linking Layer 2: $(L2)"
	@for dir in $(L2); do \
		cd "$(ROOT)$$dir" && npm link @spike-land-ai/esbuild-wasm @spike-land-ai/esbuild-wasm-mcp @spike-land-ai/shared 2>/dev/null || true; \
		cd "$(ROOT)$$dir" && npm link; \
	done
	@echo "Linking Layer 3: $(L3)"
	@for dir in $(L3); do \
		cd "$(ROOT)$$dir" && npm link @spike-land-ai/code @spike-land-ai/shared @spike-land-ai/esbuild-wasm @spike-land-ai/esbuild-wasm-mcp 2>/dev/null || true; \
		cd "$(ROOT)$$dir" && npm link; \
	done
	@echo "✓ All packages linked"

# ─── Combined ────────────────────────────────────────────────
.PHONY: check-all

check-all: lint-all test-all
	@echo "✓ All checks passed"

# ─── Health ──────────────────────────────────────────────────
.PHONY: health

health:
	@bash "$(ROOT).github/scripts/org-health.sh" "$(ROOT)"

# ─── Utility ─────────────────────────────────────────────────
.PHONY: status

status:
	@for dir in $(ALL_REPOS); do \
		if [ -d "$(ROOT)$$dir/.git" ]; then \
			branch=$$(cd "$(ROOT)$$dir" && git branch --show-current); \
			dirty=$$(cd "$(ROOT)$$dir" && git status --porcelain | head -1); \
			if [ -n "$$dirty" ]; then \
				echo "$$dir ($$branch) — dirty"; \
			else \
				echo "$$dir ($$branch) — clean"; \
			fi; \
		fi; \
	done
