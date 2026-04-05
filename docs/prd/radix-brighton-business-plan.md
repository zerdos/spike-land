# Radix Brighton — Business Plan

> Turning Brighton's food waste into energy, compost, and community value.

**Status:** Draft
**Date:** 2026-03-31
**Source:** [BBC — New bin rules begin in England](https://www.bbc.co.uk/news/articles/cn4vwj0yj20o)

---

## 1. The Opportunity

On 31 March 2026, England's **Simpler Recycling** rules took effect — the
biggest shake-up in recycling policy in 20 years. Key facts:

| Metric | Value |
|--------|-------|
| Councils missing the deadline | 79 (1 in 4) |
| Defra grant pool | >GBP 340m |
| **Brighton & Hove grant received** | **GBP 3,122,659.37** |
| **Brighton & Hove ready on time?** | **Yes** |
| English councils not yet collecting food waste | >1/3 (incl. transitional) |

Brighton & Hove is **ahead of the curve** — already collecting weekly food
waste. This creates a first-mover window: the infrastructure exists, residents
are onboarded, and GBP 3.1m in grant money is flowing.

### Why Brighton specifically

- **Green identity:** Brighton & Hove elected the UK's first Green council
  (2011). Sustainability isn't an upsell — it's baseline expectation.
- **Dense, walkable:** Compact city = efficient collection routes and high
  community engagement density.
- **University population:** 34,000+ students (Sussex + Brighton) — early
  adopters, socially motivated, digitally native.
- **Tourism economy:** 11m+ visitors/year. Visible sustainability = brand
  value for local businesses.
- **Existing infrastructure:** Weekly food waste collections already live.
  No cold-start problem.

---

## 2. What Radix Does

**Radix** is a hyperlocal circular-economy platform that sits on top of
Brighton's existing food waste collection, adding a digital layer of tracking,
community engagement, and local economic value.

### Core loop

```
Resident logs food waste --> Impact calculated (biogas kWh, CO2 saved)
        |                            |
        v                            v
Neighbourhood leaderboard    Recycling credits earned
        |                            |
        v                            v
Community pride + behaviour   Redeemable at local businesses
change reinforcement          (cafes, shops, markets)
```

### Product pillars

1. **Waste tracker** — scan/log weekly caddy contents, see energy-equivalent
   output ("your peelings powered a fridge for 18 hours")
2. **Impact dashboard** — neighbourhood-level biogas production, landfill
   diversion, CO2 reduction
3. **Community leaderboard** — streets/wards compete on diversion rates
4. **Local rewards** — recycling credits redeemable at Brighton independents
5. **Route intelligence** — optimise collection routes using participation
   data (sell to council as SaaS)

---

## 3. Revenue Model

| Stream | Year 1 | Year 2 | Year 3 |
|--------|--------|--------|--------|
| **B2G SaaS** — council dashboard + route optimisation | GBP 60k | GBP 120k | GBP 200k |
| **B2B rewards network** — local business listing fees (GBP 25/mo) | GBP 30k | GBP 90k | GBP 180k |
| **Sponsored challenges** — brand-funded community recycling drives | GBP 10k | GBP 40k | GBP 80k |
| **Data licensing** — anonymised waste composition insights to WRAP/Defra | GBP 0 | GBP 30k | GBP 60k |
| **Total** | **GBP 100k** | **GBP 280k** | **GBP 520k** |

### Unit economics (Year 2 target)

- Households on platform: 15,000 (of ~125,000 in B&H)
- Active weekly loggers: 6,000 (40% retention)
- Local businesses in rewards network: 300
- CAC: GBP 2/household (community events, word of mouth, council co-marketing)
- LTV: GBP 18/household/year (blended across all streams)

---

## 4. Go-to-Market

### Phase 1: Proof of concept (Q2 2026)

- Partner with Brighton & Hove City Council using existing relationship
  (they just received GBP 3.1m in Defra grants)
- Launch in 3 pilot wards: Hanover, Kemptown, Preston Park (high Green
  vote, dense, engaged communities)
- Free for residents. Council pays GBP 5k/month for dashboard access.
- Target: 2,000 households, 10 local business reward partners

### Phase 2: City-wide (Q4 2026)

- Expand to all Brighton & Hove wards
- Launch business rewards marketplace
- Integrate with council's existing Cityclean app/reporting
- Target: 15,000 households, 300 businesses

### Phase 3: Replicate (2027)

- Package as white-label for other councils scrambling to meet compliance
- Priority targets: the 79 councils that missed the deadline — they need
  tools to drive adoption once they launch
- Sell route optimisation as standalone SaaS

---

## 5. Competitive Landscape

| Competitor | What they do | Gap Radix fills |
|------------|-------------|-----------------|
| Council apps (e.g. Cityclean) | Collection schedules, missed bin reports | No engagement, no gamification, no impact visibility |
| Olio | Surplus food sharing | Prevents waste, doesn't track recycling or connect to council collections |
| Too Good To Go | Discounted surplus meals | Restaurant-focused, not household waste |
| Recycleye | AI waste sorting for MRFs | Industrial, not consumer-facing |

**Radix's moat:** Hyperlocal community engagement + council data integration +
local business reward network. This is a coordination problem, not a technology
problem. The platform that builds neighbourhood density first wins.

---

## 6. Costs (Year 1)

| Category | Amount |
|----------|--------|
| Engineering (1 full-stack + spike.land platform) | GBP 0 (built on spike.land) |
| Community manager (part-time, Brighton-based) | GBP 18k |
| Marketing & launch events | GBP 8k |
| Council partnership development | GBP 5k |
| Infrastructure (Cloudflare Workers, D1) | GBP 2k |
| **Total Year 1** | **GBP 33k** |

Building on spike.land's existing MCP platform means near-zero engineering
cost — the app is a composition of existing tools (waste tracking, analytics,
community, payments via Stripe).

---

## 7. Impact Metrics (WRAP-verified factors)

- 1 kitchen caddy of food waste = 18 hours of fridge power (biogas)
- 1 full collection truck = 5 years of fridge power
- Brighton & Hove diverts ~15,000 tonnes/year of food waste from landfill
- Each tonne of diverted food waste = ~0.5 tonnes CO2e avoided

**Year 2 target:** 3,000 additional tonnes diverted, 1,500 tonnes CO2e saved,
GBP 150k in revenue flowing to Brighton independents via rewards.

---

## 8. Why Now

1. **Regulatory tailwind:** Simpler Recycling is law as of today (31 March 2026)
2. **Funding available:** GBP 3.1m already allocated to Brighton & Hove
3. **Brighton is ready:** Weekly collections already live — no infrastructure gap
4. **79 councils are not ready:** Huge addressable market for year 2+ expansion
5. **WRAP backing:** Climate action org actively promoting this as "the biggest
   shake-up in 20 years" — free ecosystem marketing

---

## 9. Team

Built on **spike.land** — the open AI app store. Radix is an MCP-native app
composed from platform tools. The spike.land platform provides auth, payments,
analytics, and the MCP runtime. A Brighton-based community manager handles
the local flywheel.

---

## 10. Ask

- **Council intro:** Warm introduction to Brighton & Hove Cityclean / waste
  services team
- **Pilot wards:** Agreement to co-brand pilot in 3 wards with council support
- **WRAP partnership:** Letter of support from WRAP for grant applications
- **Seed funding:** GBP 50k to cover 18 months of runway to revenue
