/**
 * Campaign lifecycle tools (pause, resume).
 *
 * Both tools mutate live ad campaigns and are flagged DESTRUCTIVE in the tool
 * description so MCP clients can prompt for explicit confirmation.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createZodTool, errorResult, jsonResult, tryCatch } from "@spike-land-ai/mcp-server-base";
import type { GoogleAdsClient } from "../core-logic/ads-client.js";

type CampaignStateChange = "ENABLED" | "PAUSED";

async function setCampaignStatus(
  client: GoogleAdsClient,
  campaignId: string,
  status: CampaignStateChange,
) {
  const operations = [
    {
      campaignOperation: {
        update: {
          resourceName: `customers/${client.getCustomerId()}/campaigns/${campaignId}`,
          status,
        },
        updateMask: "status",
      },
    },
  ];
  return client.mutate(operations);
}

export function registerLifecycleTools(server: McpServer, client: GoogleAdsClient): void {
  createZodTool(server, {
    name: "ads_pause_campaign",
    description:
      "DESTRUCTIVE: Pause a live Google Ads campaign so it stops serving impressions. " +
      "Confirm with the user before invoking.",
    schema: {
      campaign_id: z.string().min(1).describe("Campaign ID to pause"),
    },
    async handler({ campaign_id }) {
      const campaignId = String(campaign_id);
      const result = await tryCatch(setCampaignStatus(client, campaignId, "PAUSED"));
      if (!result.ok) {
        return errorResult("API_ERROR", result.error.message, true);
      }
      return jsonResult({ success: true, campaign_id: campaignId, new_status: "PAUSED" });
    },
  });

  createZodTool(server, {
    name: "ads_resume_campaign",
    description:
      "DESTRUCTIVE: Resume a paused Google Ads campaign so it begins serving impressions and " +
      "spending budget. Confirm with the user before invoking.",
    schema: {
      campaign_id: z.string().min(1).describe("Campaign ID to resume"),
    },
    async handler({ campaign_id }) {
      const campaignId = String(campaign_id);
      const result = await tryCatch(setCampaignStatus(client, campaignId, "ENABLED"));
      if (!result.ok) {
        return errorResult("API_ERROR", result.error.message, true);
      }
      return jsonResult({ success: true, campaign_id: campaignId, new_status: "ENABLED" });
    },
  });
}

export const __test__ = { setCampaignStatus };
