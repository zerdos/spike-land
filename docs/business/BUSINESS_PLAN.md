# Business Plan — SPIKE LAND LTD

> **Company**: SPIKE LAND LTD (UK Company #16906682)
> **Date**: March 2026
> **Classification**: Confidential — For Investor & HMRC Use
> **Stage**: Pre-Revenue, Commercial Launch Stage
> **Prepared For**: SEIS Advance Assurance (Part 5, Item 3)
> **Currency**: GBP Primary (USD Secondary at £1 = $1.27)

---

## 1. Executive Summary

SPIKE LAND LTD is a UK-incorporated technology company building a managed MCP (Model Context Protocol) platform for developers and AI-native teams. The platform allows users to discover, run, and operationalise AI tools through one hosted platform rather than stitching together separate MCP servers and fragmented services. 

The product is live in beta at spike.land, featuring a working CLI (`spike-cli`), a web dashboard, and integrated hosted tools deployed on a global edge network. The company is pre-revenue, with Stripe integration near completion and a full commercial launch planned following product hardening. 

The SEIS raise of up to £250,000 will be used to accelerate go-to-market, expand the hosted tool ecosystem, and fund early hiring in growth and customer success.

**The company is SEIS-eligible: incorporated December 2025, no prior investment, fewer than 25 employees, gross assets under £350,000, carrying on a qualifying software development trade.**

---

## 2. Company Overview

| Field | Value |
|-------|-------|
| Legal Name | SPIKE LAND LTD |
| Company Number | 16906682 |
| Incorporation Date | 12 December 2025 |
| Registered Office | [Placeholder: Registered UK Address] |
| SIC Codes | 62090 (IT consultancy), 63120 (Web portals) |
| Director | Zoltan Erdos (sole director) |
| Shareholders | Zoltan Erdos — 1 ordinary share at £1 (100%) |
| Corporation Tax Ref | BRCT00003618256 |
| Corporate Structure | Independent entity; no subsidiaries |
| Funding History | No prior fundraising; no shares issued under SEIS/EIS |

**Founder background**: Zoltan Erdos is a full-stack engineer with 10+ years of experience. [Placeholder: Mention specific past successes, e.g., "Previously scaled engineering platforms to X users," "Led teams at Y," or "Significant open-source contributor to Z."] He built the entire initial platform using AI-assisted development, demonstrating both technical execution capability and the deep domain expertise required to build tools for the emerging AI developer market.

---

## 3. Traction & Evidence

The company has focused heavily on product and technical execution to de-risk the technical model before raising capital.

- **Product Status**: Live in public beta. Core infrastructure and edge database are operational.
- **Tool Ecosystem**: 80+ MCP tools are currently integrated and functional on the platform.
- **Access Channels**: `spike-cli` is published and functional; web dashboard is live.
- **Early Adoption**: [X,000+] npm downloads for `spike-cli`, [X00+] active beta testers, and [X00+] GitHub stars.
- **Commercial Readiness**: Stripe billing infrastructure is ~75% complete.

---

## 4. Problem & Solution

### 4.1 Problem

Developers building with AI face two compounding problems:

1. **Fragmented tooling** — The average developer uses 8+ SaaS tools daily (deployment, monitoring, QA, etc.). Each requires separate authentication, billing, and integration work.
2. **No managed MCP registry** — The Model Context Protocol (Anthropic, 2024) is becoming the standard for AI-tool interaction. However, developers currently must build, host, and secure their own MCP servers. There is no central, managed registry that handles authentication, rate limiting, and billing out of the box.

### 4.2 Solution

Spike Land provides a unified platform to solve this:

- **Managed MCP Registry** — Over 80 tools hosted in a single registry, with authentication, rate limiting, and metering handled by the platform.
- **Unified Access** — Tools can be invoked identically via the `spike-cli` or the web dashboard.
- **Edge-Native Infrastructure** — Deployed primarily on Cloudflare infrastructure, designed for low-latency global access and highly efficient unit economics.

---

## 5. Market Opportunity

| Metric | Value | Definition |
|--------|-------|------------|
| **TAM** | $50B+ | Global developer tools & cloud platforms |
| **SAM** | $10B | AI-powered developer platforms |
| **SOM** | $200M | MCP-native development platforms |
*\*Sources: Gartner 2024 Developer Tools Report, internal estimates.*

While the top-down market is massive, our initial Year 1-2 go-to-market is validated by a focused **bottom-up milestone**:
Targeting a niche of 5,000 highly active AI agent developers and indie hackers. Converting 5% (250 users) to a blended paid plan of ~£35/month generates an initial ARR milestone of ~£105,000, establishing clear product-market fit.

---

## 6. Target Personas (Primary Beachhead)

Rather than targeting the entire market from day one, Spike Land is focusing on a sharp initial wedge of early adopters. Customer Acquisition Cost (CAC) and Lifetime Value (LTV) figures are currently planning hypotheses to be tested and validated in Year 1.

1. **AI Agent Developer**: Builds AI agents using MCP. Discovers tools via npm and GitHub. Pain point: managing fragmented MCP server connections. Target: API PRO ($49/mo). Expected low CAC due to organic technical channels.
2. **Indie Hacker / Solo Founder**: Solo SaaS builders who need AI leverage. Pain point: tool sprawl and limited budget. Target: PRO ($29/mo). 
3. **AI Consultancy / Agency**: Small teams building AI solutions for clients. Needs multi-workspace management and per-client isolation. Target: BUSINESS ($99/mo) + API add-ons.
4. **DevOps / QA Team Lead**: Evaluates tools for team rollout. Needs audit logs, CI/CD integrations, and permission management. Target: BUSINESS ($99/mo).

---

## 7. Revenue Model & Pricing

The commercial model focuses on subscription recurring revenue (SaaS) and usage-based API add-ons. 

### 7.1 Current vs. Planned Revenue Streams

| Revenue Stream | Status | Timing |
|---|---|---|
| **Platform Subscriptions** | Active at commercial launch | Y1 |
| **API Add-ons (PRO / SCALE)** | Active at commercial launch | Y1 |
| **Credit Overages** | Planned after initial usage baseline | Y1 H2 |
| **Marketplace Take Rate (30%)** | Planned | Y2 |
| **App Builder Services** | Opportunistic / Founder-led | As needed |

### 7.2 Core Pricing Tiers

| Tier | Price | Deployments | AI Credits/mo | Team Members |
|------|-------|-------------|---------------|--------------|
| FREE | $0/mo | 3 | 100 | 1 |
| PRO | $29/mo | 10 | 2,000 | 3 |
| BUSINESS | $99/mo | Unlimited | 10,000 | 10 |

### 7.3 MCP API Access (Add-Ons)

For heavy programmatic usage (e.g., AI Agent Developers running large workloads):
- **Included in BUSINESS**: 1,000 API calls/mo (Read-only)
- **API PRO**: $49/mo (10,000 calls, full read/write)
- **API SCALE**: $149/mo (100,000 calls, webhooks, batch operations)

---

## 8. Go-to-Market Strategy

As a developer-first tool, acquisition relies heavily on Product-Led Growth (PLG) rather than expensive paid media.

1. **npm / CLI Distribution**: `npx @spike-land-ai/spike-cli` provides zero-install evaluation. This is the primary top-of-funnel engine.
2. **One-Liner Activation**: Adding spike.land as an MCP server to an AI IDE (like Claude Code) takes one terminal command.
3. **GitHub & Docs SEO**: Creating high-quality technical content, tutorials, and a strong open-source presence to capture developer search intent.
4. **Direct Outreach**: Targeting MCP tool authors with a compelling revenue-share proposition to rapidly populate the platform's marketplace.
5. **Community**: Leveraging Discord and developer communities (Hacker News, Indie Hackers) for organic word-of-mouth.

---

## 9. Competitive Landscape

The company believes its current combination of hosted MCP tooling, CLI access, and edge-native infrastructure is highly differentiated from existing point solutions.

| Competitor | Core Focus | Managed MCP Hosting? | CLI Access? | Tool Marketplace? |
|------------|-------------|------|------|--------------|
| **Vercel** | Web deployment | No | Yes | No |
| **Replit** | Cloud IDE | No | No | Limited |
| **Smithery/Glama** | MCP Directories | Directory only (No hosting) | No | No |
| **spike.land** | **MCP-first AI platform** | **Yes (80+ tools)** | **Yes (`spike-cli`)** | **Yes (70/30 rev share)** |

**Defensive Moat**: The tool marketplace introduces powerful **Network Effects**. A rich library of tools attracts developers, which in turn attracts more tool authors seeking distribution and monetization. This creates a "cold start" barrier that deters established platforms from easily cloning the ecosystem.

---

## 10. Three-Year Financial Forecasts

### 10.1 Key Assumptions
- Year 1 focuses on controlled growth, product hardening, and establishing baseline retention.
- Operational costs are exceptionally lean. Core infrastructure (Cloudflare) is highly scalable, starting at ~£5/mo and scaling efficiently. 
- **Important Note on Capital Use**: While the company can reach operational break-even with very modest spend, the £250,000 SEIS raise is explicitly intended to *accelerate growth*—funding GTM, key hires, and enterprise readiness, rather than just keeping the lights on.

### 10.2 Year 1 Profit & Loss — Monthly Detail (M1-M12)

| Month | Paying Customers | Revenue (£) | COGS (£) | Gross Profit (£) | Opex (£) | EBIT (£) |
|-------|-----------------|-------------|----------|-----------------|----------|----------|
| M1 | 5 | 165 | 30 | 135 | 2,200 | -2,065 |
| M2 | 12 | 396 | 71 | 325 | 2,200 | -1,875 |
| M3 | 22 | 726 | 131 | 595 | 2,300 | -1,705 |
| M4 | 35 | 1,155 | 208 | 947 | 2,300 | -1,353 |
| M5 | 55 | 1,815 | 327 | 1,488 | 2,400 | -912 |
| M6 | 80 | 2,640 | 475 | 2,165 | 2,500 | -335 |
| M7 | 110 | 3,630 | 653 | 2,977 | 2,600 | 377 |
| M8 | 140 | 4,900 | 882 | 4,018 | 2,700 | 1,318 |
| M9 | 160 | 5,600 | 1,008 | 4,592 | 2,800 | 1,792 |
| M10 | 185 | 6,475 | 1,166 | 5,310 | 2,800 | 2,510 |
| M11 | 210 | 7,350 | 1,323 | 6,027 | 2,900 | 3,127 |
| M12 | 228 | 7,980 | 1,436 | 6,544 | 3,000 | 3,544 |
| **Total**| | **£42,832** | **£7,710** | **£35,122** | **£30,700** | **£4,422** |

### 10.3 Year-End Balance Sheet & Cash Summary

| Item | Year 1 | Year 2 (Forecast) | Year 3 (Forecast) |
|------|--------|-------------------|-------------------|
| **Cash at Bank** | £254,423 | £354,161 | £749,162 |
| Other Assets | £3,000 | £10,000 | £28,000 |
| **Total Assets** | **£257,423** | **£364,161** | **£777,162** |
| | | | |
| Liabilities | £3,000 | £19,000 | £93,000 |
| **Net Assets** | **£254,423** | **£345,161** | **£684,162** |
| | | | |
| Share Capital* | £250,001 | £250,001 | £250,001 |
| Retained Earnings | £4,422 | £95,160 | £434,161 |
| **Total Equity** | **£254,423** | **£345,161** | **£684,162** |

*\*Note: Share Capital figure represents nominal capital plus share premium from the SEIS raise.*

---

## 11. Use of Funds & Milestones

The maximum £250,000 SEIS raise will be deployed over 18-24 months for qualifying trade purposes to achieve specific growth milestones.

| Milestone / Objective | Estimated Spend | Intended Outcome |
|-----------------------|-----------------|------------------|
| **Commercial Launch & Billing** | £25,000 | Stripe live, paid plans activated, self-serve onboarding. |
| **Platform Hardening & Docs** | £35,000 | Comprehensive developer documentation, analytics, and robust APIs. |
| **Tool Registry Expansion** | £40,000 | Scale platform to 120+ hosted tools; implement marketplace revenue share. |
| **GTM & Content Marketing** | £50,000 | Founder-led demos, SEO content, initial push to first 100 paying customers. |
| **Growth & Engineering Hires** | £80,000 | Hire Growth Lead & CS/Engineering support to lower churn and drive acquisition. |
| **Working Capital / Contingency** | £20,000 | Professional fees, legal, accounting, and buffer. |
| **Total** | **£250,000** | |

---

## 12. SEIS Risk-to-Capital Statement

The company explicitly meets the HMRC Risk-to-Capital condition:
- **Long-term growth:** SPIKE LAND LTD is a genuine commercial software business seeking to build long-term value, increase its customer base, and expand its team.
- **Capital at Risk:** The company is pre-revenue. Success is highly uncertain in a competitive and rapidly evolving AI market.
- **No capital protection:** There are no asset backings, downside protections, or capital preservation arrangements in place. 
- **Return profile:** Investor returns depend entirely on the commercial success and future enterprise value of the company, not on tax relief alone. The company is not structured to provide low-risk returns or early extraction of capital.

---

## 13. Risk Factors

1. **Market Risk (MCP Adoption):** The Model Context Protocol may not achieve widespread industry adoption. *Mitigation:* MCP is backed by Anthropic and OpenAI. Furthermore, platform tools work independently of MCP via standard API channels.
2. **Competition Risk:** Established platforms (Vercel, Replit) could add managed MCP registries. *Mitigation:* Building early network effects via the tool marketplace to create a "cold start" barrier for competitors.
3. **Concentration Risk (AI Providers):** Core user workflows depend heavily on Anthropic/OpenAI/Google APIs. Pricing or policy changes by these providers could affect margins or product behavior. *Mitigation:* The platform architecture is model-agnostic, allowing developers to route requests to alternative open-source or proprietary LLMs.
4. **Execution Risk:** A single founder creates a key-person dependency. *Mitigation:* AI-assisted development provides extreme operational leverage. SEIS investment allows for hiring a Growth Lead and CS support in Y1 H2.

---

## 14. Exit Horizons

The company is structured to target a high-multiple exit within a 5-7 year timeframe:

1. **Strategic Acquisition:** As MCP becomes a standard protocol, the platform becomes an attractive target for broader dev-tool ecosystems (e.g., Vercel, Netlify, Atlassian) seeking a managed registry and active AI developer community.
2. **Series A/B Secondary Sale:** Upon reaching significant traction (£2M+ ARR), early SEIS investors may realize returns via secondary share sales to institutional VC funds.
3. **Private Equity Buyout:** If the company continues bootstrapping on strong operating cash flow and reaches £5M+ ARR, a tech-focused Private Equity buyout represents a lucrative secondary exit path.

---
*Document Version: 2.0 (SEIS Advance Assurance Edition)*
*Prepared: March 2026*