import { createAuthClient } from "better-auth/client";

function getBaseURL(): string {
  if (typeof window === "undefined") return "https://spike.land";

  const { hostname } = window.location;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:8787";
  }

  if (hostname === "local.spike.land") {
    return "https://local.spike.land:8787";
  }

  if (
    hostname === "spike.land" ||
    hostname === "www.spike.land" ||
    hostname === "analytics.spike.land"
  ) {
    return window.location.origin;
  }

  return "https://auth-mcp.spike.land";
}

export const authClient = createAuthClient({ baseURL: getBaseURL() });
export const apiBaseURL = getBaseURL();
