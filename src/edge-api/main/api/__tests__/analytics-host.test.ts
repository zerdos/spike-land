import { describe, expect, it } from "vitest";
import { app } from "../index.js";

describe("analytics vanity host", () => {
  it("redirects the analytics subdomain root to /analytics", async () => {
    const res = await app.request(new Request("https://analytics.spike.land/"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("/analytics");
  });

  it("rewrites sub-paths under analytics host", async () => {
    const res = await app.request(new Request("https://analytics.spike.land/ga4/overview"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("/analytics/ga4/overview");
  });
});
