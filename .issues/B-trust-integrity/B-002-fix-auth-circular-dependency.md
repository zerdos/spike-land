# B-002 Fix `auth_check_session` Circular Dependency

**Priority:** P0 — Critical
**Category:** Trust & Integrity
**Type:** Bug Fix
**Affected Personas:** ALL 16 personas flagged this
**Estimated Effort:** M

## Problem

`auth_check_session` requires a `session_token` as a required field, but there is no `auth_login`, `auth_signup`, or `auth_get_token` tool in the MCP registry. Users cannot authenticate because the auth-checking tool requires a token that no other tool can provide — a circular dependency that blocks the entire auth flow.

## Evidence

Flagged across all personas:

- **AI Indie (R1)**: "`auth_check_session` requires a `session_token` input, but there's no tool to log in or obtain a session token. How does a new user authenticate?"
- **Agency Dev (R1)**: "Auth bootstrap unclear — requires a `session_token` as a required field, but there's no `auth_login` tool."
- **Classic Indie (R2)**: "`auth_check_session` marks `session_token` as required but the description says 'Optional session token' — the schema contradicts the docs"
- **Non-technical Founder (R1)**: "Auth tools require a `session_token` — where does a new user get this? There's no login flow described"
- **ML Engineer (R1)**: "unclear how to obtain this token; no onboarding guidance in the tool descriptions"

## Acceptance Criteria

- [ ] Either:
  - (a) Add `auth_login` / `auth_signup` tools that return a session token, OR
  - (b) Make `session_token` optional in `auth_check_session` and support implicit session from MCP connection context, OR
  - (c) Add clear documentation on how tokens are obtained outside MCP
- [ ] A new user can authenticate through MCP tools alone (no out-of-band steps)
- [ ] Schema and description agree on whether `session_token` is required or optional

## Implementation Notes

The auth system is in `src/mcp-auth/` (Better Auth on Cloudflare Workers). The MCP registry tool definitions are in `src/spike-land-mcp/`. The fix likely involves adding login/signup tools that delegate to the mcp-auth service, or making the session flow implicit via MCP connection headers.
