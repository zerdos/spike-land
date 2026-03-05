# Cloudflare Infrastructure Setup

## Overview

spike.land runs entirely on Cloudflare's paid Pro plan. Infrastructure is managed
via Terraform in `infrastructure/cloudflare/`.

## Terraform Resources

8 active resources managed by Terraform:

| Resource | File | Description |
|----------|------|-------------|
| `cloudflare_zone.spike_land` | `main.tf` | Zone data source |
| `cloudflare_ruleset.managed_waf` | `waf.tf` | CF Managed + OWASP + Exposed Credentials rulesets |
| `cloudflare_ruleset.rate_limiting` | `waf.tf` | Custom rate limiting rules |
| `cloudflare_ruleset.cache_rules` | `cache.tf` | Cache settings (hashed assets, JS/CSS, HTML bypass) |
| `cloudflare_tiered_cache.spike_land` | `cache.tf` | Smart tiered caching topology |
| `cloudflare_zone_setting.early_hints` | `speed.tf` | 103 Early Hints for preloading |
| `cloudflare_zone_setting.http3` | `speed.tf` | HTTP/3 (QUIC) |
| `cloudflare_zone_setting.minify` | `speed.tf` | HTML + CSS + JS minification |
| `cloudflare_zone_setting.brotli` | `speed.tf` | Brotli compression |

**Not active:** `bot_management` (commented out in `waf.tf`) — requires Enterprise plan.

## Rate Limiting Rules

| Endpoint | Limit | Timeout |
|----------|-------|---------|
| `/proxy/ai` | 30 req/min per IP | 60s block |
| `/proxy/stripe` | 10 req/min per IP | 60s block |
| `/mcp` | 120 req/min per IP | 60s block |

## Workers Deployed

| Worker | Route | Package |
|--------|-------|---------|
| spike-edge | `edge.spike.land/*` | `packages/spike-edge` |
| spike-land-mcp | `mcp.spike.land/*` | `packages/spike-land-mcp` |
| mcp-auth | `auth-mcp.spike.land/*` | `packages/mcp-auth` |
| spike-land-backend | `spike.land/*` | `packages/spike-land-backend` |
| transpile | `js.spike.land/*` | `packages/transpile` |
| spike-review | — | `packages/spike-review` |
| image-studio-worker | `image-studio-mcp.spike.land/*` | `packages/image-studio-worker` |
| spike-agent | — | `packages/spike-agent` |

## API Token Permissions

The Terraform token (`CLOUDFLARE_API_TOKEN`) needs:

- **Zone > Zone Settings** — Edit
- **Zone > Zone WAF** — Edit
- **Zone > Cache Rules** — Edit
- **Zone > Firewall Services** — Edit

Scoped to zone: `spike.land`

## How to Apply

```bash
cd infrastructure/cloudflare
terraform init          # First time only
terraform plan          # Preview changes
terraform apply         # Apply changes
```

Variables are provided via `terraform.tfvars` (gitignored):

```hcl
cloudflare_api_token = "..."
zone_id              = "..."
account_id           = "..."
```

## How to Add New Resources

1. Create or edit a `.tf` file in `infrastructure/cloudflare/`
2. Run `terraform plan` to preview
3. Run `terraform apply` to deploy
4. Add outputs to `outputs.tf` if needed
5. Commit the `.tf` files (state and providers are gitignored)

## Files

```
infrastructure/cloudflare/
├── main.tf                  # Provider config + zone data
├── variables.tf             # Input variables
├── outputs.tf               # Output values
├── waf.tf                   # WAF managed rulesets + rate limiting
├── cache.tf                 # Cache rules + tiered caching
├── speed.tf                 # Early hints, HTTP/3, minify, brotli
├── .terraform.lock.hcl      # Provider lockfile (committed)
├── .terraform/              # Provider binaries (gitignored)
├── terraform.tfstate        # State file (gitignored)
└── terraform.tfvars         # Secrets (gitignored)
```
