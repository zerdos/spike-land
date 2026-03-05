/**
 * Cloudflare Workers environment bindings for qa-studio.
 */

export interface Env {
  BROWSER: Fetcher;
  BROWSER_SESSION: DurableObjectNamespace;
}
