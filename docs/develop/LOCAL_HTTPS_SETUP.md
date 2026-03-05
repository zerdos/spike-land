# Local HTTPS Development Setup

Run `https://local.spike.land` locally with valid TLS certificates for
development. This matches production URLs for auth cookies, CORS, and OAuth
redirects.

## Prerequisites

```bash
brew install mkcert nss   # nss adds Firefox support
mkcert -install           # Install local CA (one-time)
```

## Setup

### 1. Add DNS entry

```bash
sudo bash -c 'echo "127.0.0.1 local.spike.land" >> /etc/hosts'
```

### 2. Generate certificates

```bash
mkdir -p .dev-certs
mkcert -cert-file .dev-certs/local.spike.land.pem \
       -key-file .dev-certs/local.spike.land-key.pem \
       local.spike.land localhost 127.0.0.1
```

The `.dev-certs/` directory is gitignored.

### 3. Start development

```bash
bash scripts/dev-local.sh
```

This starts:
- **spike-app** at `https://local.spike.land:5173` (Vite dev server with HMR)
- **spike-edge** at `https://local.spike.land:8787` (wrangler dev with HTTPS)

### 4. CORS / Auth allowlists

Add `https://local.spike.land:5173` to allowed origins in:
- `src/spike-edge/.dev.vars` — `ALLOWED_ORIGINS`
- `src/mcp-auth/.dev.vars` — trusted origins

## How It Works

- `mkcert` creates a local Certificate Authority trusted by your OS/browsers
- Vite detects `.dev-certs/` and enables HTTPS automatically (configured in
  `packages/spike-app/vite.config.ts`)
- wrangler uses `--local-protocol=https` with the same certificates
- No certificate warnings in any browser

## Troubleshooting

**Certificate not trusted:** Run `mkcert -install` again and restart your browser.

**Port 443 requires root:** We use ports 5173/8787 instead. No sudo needed.

**Firefox still warns:** Ensure `nss` was installed before `mkcert -install`.
Reinstall: `brew install nss && mkcert -install`.
