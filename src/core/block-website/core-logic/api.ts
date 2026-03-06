const isDev = typeof import.meta !== "undefined" && (import.meta as { env?: { DEV?: boolean } }).env?.DEV === true;

export const API_BASE = isDev ? "" : "https://api.spike.land";

export function apiUrl(path: string): string {
  return `${API_BASE}/api${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Fetch wrapper that resolves API paths correctly in both dev (relative) and
 * production (https://api.spike.land) environments.
 * Always sends credentials (cookies) so cross-origin requests work.
 */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), { credentials: "include", ...init });
}
