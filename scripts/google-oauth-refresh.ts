#!/usr/bin/env npx tsx
/**
 * Obtain a Google OAuth2 refresh token with Ads + Analytics scopes.
 *
 * Usage:
 *   npx tsx scripts/google-oauth-refresh.ts
 */

import { createServer } from "node:http";
import { execSync } from "node:child_process";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in ~/.secrets");
  process.exit(1);
}
const PORT = 3000;
const REDIRECT_URI = `http://localhost:${PORT}`;

const SCOPES = [
  "https://www.googleapis.com/auth/adwords",
  "https://www.googleapis.com/auth/analytics.readonly",
].join(" ");

const server = createServer(async (req, res) => {
  const url = new URL(req.url!, REDIRECT_URI);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<h1>Error: ${error}</h1>`);
    console.error(`OAuth error: ${error}`);
    server.close();
    process.exit(1);
  }

  if (!code) {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<h1>Waiting...</h1>");
    return;
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }).toString(),
  });

  const tokenData = (await tokenRes.json()) as {
    refresh_token?: string;
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (tokenData.error) {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<h1>Error: ${tokenData.error}</h1><p>${tokenData.error_description}</p>`);
    console.error(`Token error: ${tokenData.error} - ${tokenData.error_description}`);
    server.close();
    process.exit(1);
  }

  if (!tokenData.refresh_token) {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<h1>No refresh token</h1><p>Revoke access at myaccount.google.com/permissions then retry.</p>");
    server.close();
    process.exit(1);
  }

  res.writeHead(200, { "Content-Type": "text/html" });
  res.end("<h1>Success!</h1><p>You can close this tab.</p>");

  console.log("\n=== SUCCESS ===\n");
  console.log(`export GOOGLE_REFRESH_TOKEN="${tokenData.refresh_token}"`);
  console.log("\nPaste the line above into ~/.secrets, then: source ~/.secrets");

  server.close();
});

server.listen(PORT, () => {
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");

  console.log(`Listening on ${REDIRECT_URI}\n`);

  try {
    execSync(`open "${authUrl.toString()}"`, { stdio: "ignore" });
  } catch {}
});
