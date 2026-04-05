# Architecture Decision Record (ADR): Core Platform Stack

## 1. Cloudflare Workers over AWS
**Context:** As a solo technical founder, operational overhead must be minimized. 
**Decision:** Standardize on Cloudflare Workers.
**Rationale:**
- Zero cold starts and global distribution out-of-the-box.
- Integrated edge networking, security, and routing.
- Worker deployments managed with `wrangler`; WAF/cache/zone settings managed with Terraform (see [CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md)). Terraform scope is intentionally narrow: zone-level settings only, not application deployments.
- Reduces infrastructure management time to near-zero, maximizing time spent on product.

## 2. Cloudflare D1 over Traditional Postgres
**Context:** Relational data storage is required for users, organizations, and agent state. 
**Decision:** Standardize on Cloudflare D1 (Serverless SQLite).
**Rationale:**
- Native integration with Cloudflare Workers.
- Zero connection pooling limits (HTTP-based API).
- Instant read-replication at the edge.

## 3. Multiplexer Model for MCP (Model Context Protocol)
**Context:** spike.land requires connecting multiple AI agents to various tools and contexts dynamically.
**Decision:** Implement a Multiplexer architecture for MCP routing.
**Rationale:**
- Allows a single agent connection to securely fan out to multiple data sources and tools.
- Centralizes authentication and logging for tool usage.