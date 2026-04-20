/// <reference types="@cloudflare/workers-types" />

export interface Variables {
  userId: string;
  requestId: string;
}

export interface Env {
  DB: D1Database;
  AUTH_MCP: Fetcher;
  AI?: Ai;
  APP_ENV?: string;
}
