const UPPERCASE_TOKENS = new Set([
  "api",
  "css",
  "csv",
  "dom",
  "dns",
  "e2e",
  "html",
  "http",
  "https",
  "id",
  "ip",
  "json",
  "jwt",
  "mcp",
  "mdx",
  "sdk",
  "sql",
  "ssh",
  "ssl",
  "tcp",
  "tls",
  "ts",
  "tsx",
  "ui",
  "uri",
  "url",
  "utc",
  "ux",
  "xml",
]);

function formatToken(token: string): string {
  if (/^\d+$/.test(token)) return token;

  const lower = token.toLowerCase();
  if (UPPERCASE_TOKENS.has(lower)) {
    return lower.toUpperCase();
  }

  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function formatIdentifier(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[./]/g, " ")
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((token) => formatToken(token))
    .join(" ");
}

export function formatValueLabel(value: string): string {
  if (/[./:]/.test(value) || /\d/.test(value)) {
    return value;
  }

  return formatIdentifier(value);
}
