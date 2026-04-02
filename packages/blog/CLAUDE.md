# CLAUDE.md — blog.spike.land

## Overview

Server-rendered blog for spike.land built with **RWSDK** (RedwoodSDK) — a
server-first React framework running on Cloudflare Workers. This is the first
RWSDK experiment in the spike.land monorepo.

## Architecture

- **Framework:** RWSDK v1.0.4 (React Server Components on Cloudflare Workers)
- **Rendering:** Full server-side rendering with streaming HTML
- **Data:** Reads from the same D1 database (`spike-edge-analytics`) as spike-edge
- **Images:** Served from the same R2 bucket (`spike-app-assets`) via spike-edge URLs
- **Domain:** `blog.spike.land` (Cloudflare custom domain)
- **No client JS required** for content rendering — progressive enhancement only

## Commands

```bash
npm run dev       # Vite + Miniflare dev server (localhost:5173)
npm run build     # Production build
npm run deploy    # Deploy to Cloudflare Workers
npm run typecheck # TypeScript check
```

## Key Files

```
src/
├── worker.tsx              # Entry point — defineApp with routes
├── client.tsx              # Client hydration (minimal)
└── app/
    ├── document.tsx        # HTML shell with dynamic meta tags
    ├── headers.ts          # Security headers middleware
    ├── db.ts               # D1 queries and blog data types
    ├── pages/
    │   ├── home.tsx        # Blog index (server component)
    │   ├── post.tsx        # Individual post (server component)
    │   └── rss.ts          # RSS 2.0 feed
    └── shared/
        └── post-card.tsx   # Blog card component
```

## Data Flow

All components are **server components** — they query D1 directly during
rendering. No API calls, no client-side data fetching for content.

```
Request → Worker → Middleware → Router → Server Component → D1 Query → Streaming HTML
```

## i18n

Supports 9 languages (en + hu, de, fr, es, it, ja, zh, ru) via `?lang=` query
param or `Accept-Language` header. Falls back to English.

## Relationship to spike-edge

This Worker is **read-only** against the shared D1 database. Blog content is
seeded via `scripts/seed-blog.ts` (which writes to D1 via spike-edge). Images
are served via `spike.land/api/blog-images/` URLs (spike-edge handles generation
and R2 caching).
