/// <reference types="@cloudflare/workers-types" />
import { describe, expect, it } from "vitest";
import { app } from "../index.js";
import type { Env } from "../../core-logic/env.js";

describe("POST /proxy/tts auth behavior", () => {
  it("does not require session auth", async () => {
    const res = await app.request(
      "/proxy/tts",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "hello world" }),
      },
      {
        ELEVENLABS_API_KEY: "",
      } as unknown as Env,
    );

    // Missing ElevenLabs config should surface as service unavailable,
    // not an auth middleware rejection.
    expect(res.status).toBe(503);
    expect(res.status).not.toBe(401);
  });
});
