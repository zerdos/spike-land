/// <reference types="@cloudflare/workers-types" />

export interface Variables {
  userId: string;
  userEmail: string;
  requestId: string;
}

export interface Env {
  DB: D1Database;
  RAW_EMAILS: R2Bucket;
  AUTH_MCP: Fetcher;
  RESEND_API_KEY?: string;
  ALLOWED_INBOUND_DOMAINS?: string;
  APP_ENV?: string;
}
