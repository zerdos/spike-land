#!/usr/bin/env npx tsx
/**
 * Generate Apple Sign-In client secret JWT.
 *
 * Usage:
 *   npx tsx scripts/generate-apple-secret.ts \
 *     --team-id XXXXXXXXXX \
 *     --key-id XXXXXXXXXX \
 *     --services-id com.spike.land.web \
 *     --key-file ~/path/to/AuthKey_XXXXXXXX.p8
 *
 * Or run interactively:
 *   yarn generate:apple-secret
 */

import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import * as readline from "node:readline";
import { execSync } from "node:child_process";

// Apple max expiry is 6 months (180 days)
const MAX_EXPIRY_SECONDS = 180 * 24 * 60 * 60;

interface AppleSecretConfig {
  teamId: string;
  keyId: string;
  servicesId: string;
  keyFile: string;
}

function parseArgs(): Partial<AppleSecretConfig> & { help?: boolean; deploy?: boolean } {
  const args = process.argv.slice(2);
  const result: Partial<AppleSecretConfig> & { help?: boolean; deploy?: boolean } = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--help":
      case "-h":
        result.help = true;
        break;
      case "--team-id":
        result.teamId = args[++i];
        break;
      case "--key-id":
        result.keyId = args[++i];
        break;
      case "--services-id":
        result.servicesId = args[++i];
        break;
      case "--key-file":
        result.keyFile = args[++i];
        break;
      case "--deploy":
        result.deploy = true;
        break;
    }
  }
  return result;
}

function printUsage(): void {
  console.log(`
Apple Sign-In Client Secret Generator

Generates a JWT client secret for Apple Sign-In (ES256, 180-day expiry).

Usage:
  npx tsx scripts/generate-apple-secret.ts [options]

Options:
  --team-id <id>        Apple Developer Team ID (10 chars)
  --key-id <id>         Key ID from Apple Developer portal (10 chars)
  --services-id <id>    Services ID (e.g., com.spike.land.web)
  --key-file <path>     Path to the .p8 private key file
  --deploy              Push secrets to Cloudflare via wrangler
  -h, --help            Show this help message

If options are omitted, you will be prompted interactively.

Example:
  npx tsx scripts/generate-apple-secret.ts \\
    --team-id XXXXXXXXXX \\
    --key-id YYYYYYYYYY \\
    --services-id com.spike.land.web \\
    --key-file ~/AuthKey_YYYYYYYYYY.p8
`);
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function base64url(data: Buffer): string {
  return data.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generateJwt(config: AppleSecretConfig): string {
  const keyPem = fs.readFileSync(path.resolve(config.keyFile), "utf-8");

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: config.keyId };
  const payload = {
    iss: config.teamId,
    aud: "https://appleid.apple.com",
    sub: config.servicesId,
    iat: now,
    exp: now + MAX_EXPIRY_SECONDS,
  };

  const headerB64 = base64url(Buffer.from(JSON.stringify(header)));
  const payloadB64 = base64url(Buffer.from(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const sign = crypto.createSign("SHA256");
  sign.update(signingInput);
  const derSig = sign.sign({ key: keyPem, dsaEncoding: "ieee-p1363" });

  const signatureB64 = base64url(derSig);
  return `${signingInput}.${signatureB64}`;
}

async function main(): Promise<void> {
  const args = parseArgs();

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  const teamId = args.teamId || (await prompt("Team ID (10 chars): "));
  const keyId = args.keyId || (await prompt("Key ID (10 chars): "));
  const servicesId = args.servicesId || (await prompt("Services ID (e.g., com.spike.land.web): "));
  const keyFile = args.keyFile || (await prompt("Path to .p8 key file: "));

  if (!teamId || !keyId || !servicesId || !keyFile) {
    console.error("Error: All fields are required.");
    process.exit(1);
  }

  const resolvedKeyFile = path.resolve(keyFile.replace(/^~/, process.env.HOME || "~"));
  if (!fs.existsSync(resolvedKeyFile)) {
    console.error(`Error: Key file not found: ${resolvedKeyFile}`);
    process.exit(1);
  }

  const config: AppleSecretConfig = { teamId, keyId, servicesId, keyFile: resolvedKeyFile };

  const jwt = generateJwt(config);

  const expDate = new Date(Date.now() + MAX_EXPIRY_SECONDS * 1000);
  console.log("\n--- Apple Sign-In Credentials ---\n");
  console.log(`AUTH_APPLE_ID=${servicesId}`);
  console.log(`AUTH_APPLE_SECRET=${jwt}`);
  console.log(`\nJWT expires: ${expDate.toISOString()}`);
  console.log("Rotate before expiry by re-running this script.\n");

  if (args.deploy) {
    console.log("Deploying secrets to Cloudflare (packages/mcp-auth)...\n");
    try {
      execSync(
        `echo "${servicesId}" | npx wrangler secret put AUTH_APPLE_ID --config packages/mcp-auth/wrangler.toml`,
        { stdio: "inherit" },
      );
      execSync(
        `echo "${jwt}" | npx wrangler secret put AUTH_APPLE_SECRET --config packages/mcp-auth/wrangler.toml`,
        {
          stdio: "inherit",
        },
      );
      console.log("\nSecrets deployed successfully.");
    } catch {
      console.error("\nFailed to deploy secrets. Make sure wrangler is authenticated.");
      process.exit(1);
    }
  }
}

main();
