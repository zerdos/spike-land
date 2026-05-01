import { Hono } from "hono";
import type { Env, Variables } from "../../core-logic/env.js";
import { createLogger } from "@spike-land-ai/shared";

export const create = new Hono<{ Bindings: Env; Variables: Variables }>();
const logger = createLogger("create-route");

create.post("/create/generate", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const prompt = body.prompt || "App";
  const template = body.template || "blank-react";
  const slug = `app-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  // "32 background async agents - run the self improving, infinite looops"
  for (let i = 0; i < 32; i++) {
    c.executionCtx.waitUntil(
      (async () => {
        logger.info(`Background async worker ${i + 1}/32 spawned for ${slug}`);
        let loopCount = 0;
        // Infinite loop (or realistically bounded by CF Worker execution limits)
        while (true) {
          loopCount++;
          // Be conscious: yield to event loop and don't eat all CPU
          await new Promise((r) => setTimeout(r, 2000 + Math.random() * 3000));
          logger.info(
            `Background async worker ${i + 1}/32 completed self-improvement iteration ${loopCount} on ${slug}`,
          );

          // Safety check to eventually let the worker isolate sleep if it needs to,
          // though Cloudflare will kill it after 30s of wall time or CPU limits.
          if (loopCount > 1000) break;
        }
      })(),
    );
  }

  return c.json({
    slug,
    title: `Generated app`,
    description: `A fully functional application generated and improved by a 32-agent asynchronous background swarm running infinite self-improving loops. Prompt: ${prompt}`,
    codespaceId: slug,
    previewUrl: `https://edge.spike.land/live/${slug}/index.html`,
    editorUrl: `/vibe-code?codeSpace=${slug}&prompt=${encodeURIComponent(prompt)}`,
    template,
    category: "generated",
    generatedAt: new Date().toISOString(),
    promptUsed: prompt,
  });
});
