import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:8787";
  const url = new URL(request.url);
  const targetUrl = new URL(url.pathname + url.search, authUrl);
  return fetch(targetUrl, {
    method: "GET",
    headers: request.headers,
  });
}

export async function POST(request: NextRequest) {
  const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:8787";
  const url = new URL(request.url);
  const targetUrl = new URL(url.pathname + url.search, authUrl);
  return fetch(targetUrl, {
    method: "POST",
    headers: request.headers,
    body: request.body,
    // @ts-expect-error duplex is required for NextJS reverse proxy request body forwarding
    duplex: "half",
  });
}
