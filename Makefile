# spike-land-ai — Bulk operations across all repos
#
# Usage:
#   make build-all     Build in dependency order (via yarn workspaces)
#   make test-all      Run all tests
#   make lint-all      Run all linters
#   make check-all     lint + test everything
#   make validate      Check workspace graph vs dependency-map.json

SHELL := /bin/bash
ROOT := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))

.PHONY: build-all test-all lint-all check-all health status validate

build-all:
	yarn workspaces foreach -Apt run build
	@echo "All repos built successfully"

test-all:
	yarn workspaces foreach -Ap run test
	@echo "All tests passed"

lint-all:
	yarn workspaces foreach -Ap run lint
	@echo "All lint checks passed"

check-all: lint-all test-all
	@echo "All checks passed"

health:
	@bash "$(ROOT).github/scripts/org-health.sh" "$(ROOT)"

validate:
	node "$(ROOT).github/scripts/validate-workspace-graph.mjs"

status:
	@for dir in $$(yarn workspaces list --json 2>/dev/null | node -e "\
		const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\n');\
		lines.forEach(l => { const w = JSON.parse(l); if (w.location !== '.') console.log(w.location); })"); do \
		if [ -d "$(ROOT)$$dir/.git" ]; then \
			branch=$$(cd "$(ROOT)$$dir" && git branch --show-current); \
			dirty=$$(cd "$(ROOT)$$dir" && git status --porcelain | head -1); \
			if [ -n "$$dirty" ]; then echo "$$dir ($$branch) — dirty"; \
			else echo "$$dir ($$branch) — clean"; fi; \
		fi; \
	done
