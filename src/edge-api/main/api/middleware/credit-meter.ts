/**
 * Credit Metering Middleware
 *
 * Runs before /proxy/ai to check credit balance.
 * Business tier users bypass metering (unlimited).
 * Deducts 1 credit after a successful proxy call.
 */

import type { MiddlewareHandler } from "hono";
import type { Env, Variables } from "../../core-logic/env.js";
import { getBalance, deductCredit } from "../../core-logic/credit-service.js";
import { resolveEffectiveTier } from "../../core-logic/tier-service.js";
import { createLogger } from "@spike-land-ai/shared";

const log = createLogger("spike-edge");

export const creditMeterMiddleware: MiddlewareHandler<{
  Bindings: Env;
  Variables: Variables;
}> = async (c, next) => {
  const userId = c.get("userId") as string | undefined;

  // No userId — auth middleware should have already rejected, but be defensive
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const tier = await resolveEffectiveTier(c.env.DB, userId);

  // Business tier is unlimited — skip metering
  if (tier === "business") {
    return next();
  }

  const { balance } = await getBalance(c.env.DB, userId);
  const required = 1;

  if (balance < required) {
    const dailyLimit = tier === "free" ? "50" : "500";
    const upgradeOptions = [
      ...(tier === "free"
        ? [
            {
              action: "upgrade_pro",
              label: "Go Pro — $29/mo (500 credits/day)",
              url: "https://spike.land/pricing",
              checkout: "https://edge.spike.land/api/checkout?tier=pro",
            },
          ]
        : []),
      {
        action: "upgrade_business",
        label: "Go Business — $99/mo (unlimited credits)",
        url: "https://spike.land/pricing",
        checkout: "https://edge.spike.land/api/checkout?tier=business",
      },
      {
        action: "buy_credits",
        label: "Buy a credit pack (from $5)",
        url: "https://edge.spike.land/api/credits/purchase",
      },
      {
        action: "byok",
        label: "Use your own API key (free Pro access)",
        url: "https://spike.land/pricing#byok",
        hint: "Store your Anthropic, OpenAI, or Google API key to bypass credit limits entirely.",
      },
    ];

    return c.json(
      {
        error: "insufficient_credits",
        balance,
        required,
        tier,
        upgrade: {
          message: `You've used all your ${dailyLimit} daily credits. Upgrade for more.`,
          options: upgradeOptions,
        },
        retryAfter: "tomorrow",
        resetAt: new Date(new Date().setUTCHours(24, 0, 0, 0)).toISOString(),
      },
      402,
    );
  }

  // Run the actual handler
  await next();

  // Deduct only on success (2xx)
  if (c.res.status >= 200 && c.res.status < 300) {
    const requestId = (c.get("requestId") as string | undefined) ?? crypto.randomUUID();
    try {
      await deductCredit(c.env.DB, userId, required, "AI proxy call", requestId);
    } catch {
      // Non-fatal — log but don't fail the response
      log.error("Failed to deduct credit", { userId });
    }
  }
};
