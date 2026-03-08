#!/usr/bin/env npx tsx
/**
 * 16-Agent Google Analytics + Google Ads Analysis
 *
 * Runs 14 parallel API queries (GA4 + Google Ads), 2 cross-reference analyses,
 * then generates a Markdown report with prioritized recommendations.
 *
 * Usage:
 *   npx tsx scripts/ga-ads-analysis.ts              # Markdown report
 *   npx tsx scripts/ga-ads-analysis.ts --json        # JSON output
 *   npx tsx scripts/ga-ads-analysis.ts --days 14     # Custom lookback
 *
 * Env vars (from ~/.secrets + src/mcp-tools/google-ads/.env.local):
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN,
 *   GA4_PROPERTY_ID, GOOGLE_ADS_CUSTOMER_ID, GOOGLE_ADS_DEVELOPER_TOKEN
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleAuthClient } from "../src/mcp-tools/google-analytics/core-logic/google-oauth.js";
import { GoogleAdsClient } from "../src/mcp-tools/google-ads/core-logic/ads-client.js";

const __dirname = import.meta.dirname ?? dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Config & env loading
// ---------------------------------------------------------------------------

function loadDotEnv(filePath: string): void {
  try {
    const content = readFileSync(filePath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // File doesn't exist, skip
  }
}

// Load env files (process.env from ~/.secrets via .zshrc takes precedence)
loadDotEnv(resolve(__dirname, "../.env.local"));

const args = process.argv.slice(2);
const jsonOutput = args.includes("--json");
const daysIdx = args.indexOf("--days");
const DAYS = daysIdx !== -1 ? parseInt(args[daysIdx + 1] || "7", 10) : 7;

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    console.error(`Missing env var: ${key}`);
    process.exit(1);
  }
  return val;
}

const GOOGLE_CLIENT_ID = requireEnv("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = requireEnv("GOOGLE_CLIENT_SECRET");
const GOOGLE_REFRESH_TOKEN = requireEnv("GOOGLE_REFRESH_TOKEN");
const GA4_PROPERTY_ID = requireEnv("GA4_PROPERTY_ID");
const GOOGLE_ADS_CUSTOMER_ID = requireEnv("GOOGLE_ADS_CUSTOMER_ID");
const GOOGLE_ADS_DEVELOPER_TOKEN = requireEnv("GOOGLE_ADS_DEVELOPER_TOKEN");

// ---------------------------------------------------------------------------
// Auth clients
// ---------------------------------------------------------------------------

const gaAuth = new GoogleAuthClient({
  clientId: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  refreshToken: GOOGLE_REFRESH_TOKEN,
});

// Google Ads auth: use gcloud ADC token (the OAuth refresh token causes 500s
// with the Ads API due to client/account linkage issues, but gcloud ADC works).
class GcloudAdsAuthClient {
  private readonly developerToken: string;
  private readonly customerId: string;
  private cachedToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(opts: { developerToken: string; customerId: string }) {
    this.developerToken = opts.developerToken;
    this.customerId = opts.customerId.replace(/-/g, "");
  }

  getCustomerId(): string {
    return this.customerId;
  }

  async authHeaders(): Promise<Record<string, string>> {
    const token = this.getAccessToken();
    return {
      Authorization: `Bearer ${token}`,
      "developer-token": this.developerToken,
      "Content-Type": "application/json",
    };
  }

  private getAccessToken(): string {
    const now = Date.now();
    if (this.cachedToken && now < this.tokenExpiresAt - 60_000) {
      return this.cachedToken;
    }
    try {
      this.cachedToken = execSync(
        "gcloud auth application-default print-access-token 2>/dev/null",
        { encoding: "utf-8" },
      ).trim();
      // ADC tokens last ~1 hour
      this.tokenExpiresAt = now + 50 * 60 * 1000;
      return this.cachedToken;
    } catch {
      throw new Error(
        "Failed to get gcloud ADC token. Run:\n" +
        "  gcloud auth application-default login \\\n" +
        '    --client-id-file=scripts/google-client-secret.json \\\n' +
        '    --scopes="https://www.googleapis.com/auth/adwords,https://www.googleapis.com/auth/analytics.readonly"',
      );
    }
  }
}

const adsAuth = new GcloudAdsAuthClient({
  developerToken: GOOGLE_ADS_DEVELOPER_TOKEN,
  customerId: GOOGLE_ADS_CUSTOMER_ID,
});

const adsClient = new GoogleAdsClient(adsAuth as any);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AgentResult {
  agent: number;
  name: string;
  status: "ok" | "error" | "empty";
  data: unknown;
  error?: string;
}

interface GA4ReportRow {
  dimensionValues: Array<{ value: string }>;
  metricValues: Array<{ value: string }>;
}

interface GA4ReportResponse {
  rows?: GA4ReportRow[];
  rowCount?: number;
  metadata?: unknown;
}

interface Recommendation {
  priority: "HIGH" | "MEDIUM" | "LOW";
  category: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const endDate = new Date();
const startDate = new Date();
startDate.setDate(startDate.getDate() - DAYS);
const START = formatDate(startDate);
const END = formatDate(endDate);

// ---------------------------------------------------------------------------
// GA4 API helper
// ---------------------------------------------------------------------------

async function ga4Report(
  dimensions: string[],
  metrics: string[],
  limit = 100,
): Promise<GA4ReportResponse> {
  const headers = await gaAuth.authHeaders();
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`;
  const body = {
    dimensions: dimensions.map((name) => ({ name })),
    metrics: metrics.map((name) => ({ name })),
    dateRanges: [{ startDate: START, endDate: END }],
    limit,
  };
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GA4 API error (${res.status}): ${text}`);
  }
  return (await res.json()) as GA4ReportResponse;
}

async function ga4Realtime(
  dimensions: string[],
  metrics: string[],
  limit = 50,
): Promise<GA4ReportResponse> {
  const headers = await gaAuth.authHeaders();
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runRealtimeReport`;
  const body = {
    dimensions: dimensions.map((name) => ({ name })),
    metrics: metrics.map((name) => ({ name })),
    limit,
  };
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GA4 Realtime error (${res.status}): ${text}`);
  }
  return (await res.json()) as GA4ReportResponse;
}

// ---------------------------------------------------------------------------
// Google Ads GAQL helper
// ---------------------------------------------------------------------------

function gaqlDateRange(): string {
  return `segments.date BETWEEN '${START}' AND '${END}'`;
}

// ---------------------------------------------------------------------------
// Agent definitions
// ---------------------------------------------------------------------------

async function agent1_trafficOverview(): Promise<AgentResult> {
  const data = await ga4Report(
    ["date"],
    ["sessions", "activeUsers", "screenPageViews", "bounceRate", "averageSessionDuration", "newUsers"],
  );
  return { agent: 1, name: "Traffic Overview", status: data.rows?.length ? "ok" : "empty", data };
}

async function agent2_trafficSources(): Promise<AgentResult> {
  const data = await ga4Report(
    ["sessionSource", "sessionMedium"],
    ["sessions", "activeUsers", "bounceRate", "averageSessionDuration"],
    50,
  );
  return { agent: 2, name: "Traffic Sources", status: data.rows?.length ? "ok" : "empty", data };
}

async function agent3_topPages(): Promise<AgentResult> {
  const data = await ga4Report(
    ["pagePath", "pageTitle"],
    ["screenPageViews", "activeUsers", "bounceRate", "averageSessionDuration"],
    50,
  );
  return { agent: 3, name: "Top Pages", status: data.rows?.length ? "ok" : "empty", data };
}

async function agent4_devices(): Promise<AgentResult> {
  const data = await ga4Report(
    ["deviceCategory", "operatingSystem", "browser"],
    ["sessions", "activeUsers", "bounceRate"],
    50,
  );
  return { agent: 4, name: "Devices", status: data.rows?.length ? "ok" : "empty", data };
}

async function agent5_geography(): Promise<AgentResult> {
  const data = await ga4Report(
    ["country", "city"],
    ["sessions", "activeUsers", "bounceRate"],
    50,
  );
  return { agent: 5, name: "Geography", status: data.rows?.length ? "ok" : "empty", data };
}

async function agent6_userFlow(): Promise<AgentResult> {
  const data = await ga4Report(
    ["landingPagePlusQueryString", "sessionSource"],
    ["sessions", "bounceRate", "averageSessionDuration", "screenPageViewsPerSession"],
    50,
  );
  return { agent: 6, name: "User Flow", status: data.rows?.length ? "ok" : "empty", data };
}

async function agent7_events(): Promise<AgentResult> {
  const data = await ga4Report(
    ["eventName"],
    ["eventCount", "totalUsers"],
    100,
  );
  return { agent: 7, name: "Events & Conversions", status: data.rows?.length ? "ok" : "empty", data };
}

async function agent8_realtime(): Promise<AgentResult> {
  const data = await ga4Realtime(
    ["country", "deviceCategory"],
    ["activeUsers"],
  );
  return { agent: 8, name: "Realtime", status: data.rows?.length ? "ok" : "empty", data };
}

async function agent9_campaignOverview(): Promise<AgentResult> {
  const query = `
    SELECT
      campaign.name, campaign.status, campaign.id,
      campaign.advertising_channel_type,
      metrics.impressions, metrics.clicks, metrics.cost_micros,
      metrics.ctr, metrics.average_cpc,
      metrics.conversions, metrics.conversions_value,
      metrics.cost_per_conversion
    FROM campaign
    WHERE ${gaqlDateRange()}
      AND campaign.advertising_channel_type = 'PERFORMANCE_MAX'
    ORDER BY metrics.cost_micros DESC
  `;
  const data = await adsClient.search(query);
  return { agent: 9, name: "Campaign Overview", status: data.length ? "ok" : "empty", data };
}

async function agent10_dailyTrend(): Promise<AgentResult> {
  const query = `
    SELECT
      segments.date,
      metrics.impressions, metrics.clicks, metrics.cost_micros,
      metrics.ctr, metrics.average_cpc, metrics.conversions
    FROM campaign
    WHERE ${gaqlDateRange()}
      AND campaign.advertising_channel_type = 'PERFORMANCE_MAX'
    ORDER BY segments.date ASC
  `;
  const data = await adsClient.search(query);
  return { agent: 10, name: "Daily Trend", status: data.length ? "ok" : "empty", data };
}

async function agent11_searchTerms(): Promise<AgentResult> {
  const query = `
    SELECT
      search_term_view.search_term,
      metrics.impressions, metrics.clicks, metrics.cost_micros,
      metrics.conversions, metrics.ctr
    FROM search_term_view
    WHERE ${gaqlDateRange()}
      AND campaign.advertising_channel_type = 'PERFORMANCE_MAX'
    ORDER BY metrics.clicks DESC
    LIMIT 100
  `;
  const data = await adsClient.search(query);
  return { agent: 11, name: "Search Terms", status: data.length ? "ok" : "empty", data };
}

async function agent12_deviceSplit(): Promise<AgentResult> {
  const query = `
    SELECT
      segments.device,
      metrics.impressions, metrics.clicks, metrics.cost_micros,
      metrics.ctr, metrics.average_cpc, metrics.conversions
    FROM campaign
    WHERE ${gaqlDateRange()}
      AND campaign.advertising_channel_type = 'PERFORMANCE_MAX'
  `;
  const data = await adsClient.search(query);
  return { agent: 12, name: "Device Split", status: data.length ? "ok" : "empty", data };
}

async function agent13_networkSplit(): Promise<AgentResult> {
  const query = `
    SELECT
      segments.ad_network_type,
      metrics.impressions, metrics.clicks, metrics.cost_micros,
      metrics.ctr, metrics.conversions
    FROM campaign
    WHERE ${gaqlDateRange()}
      AND campaign.advertising_channel_type = 'PERFORMANCE_MAX'
  `;
  const data = await adsClient.search(query);
  return { agent: 13, name: "Network Split", status: data.length ? "ok" : "empty", data };
}

async function agent14_demographics(): Promise<AgentResult> {
  const genderQuery = `
    SELECT
      ad_group_criterion.gender.type,
      metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.ctr
    FROM gender_view
    WHERE ${gaqlDateRange()}
      AND campaign.advertising_channel_type = 'PERFORMANCE_MAX'
  `;
  const ageQuery = `
    SELECT
      ad_group_criterion.age_range.type,
      metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.ctr
    FROM age_range_view
    WHERE ${gaqlDateRange()}
      AND campaign.advertising_channel_type = 'PERFORMANCE_MAX'
  `;
  const [gender, age] = await Promise.all([
    adsClient.search(genderQuery).catch(() => []),
    adsClient.search(ageQuery).catch(() => []),
  ]);
  const hasData = gender.length > 0 || age.length > 0;
  return { agent: 14, name: "Demographics", status: hasData ? "ok" : "empty", data: { gender, age } };
}

// ---------------------------------------------------------------------------
// Cross-reference agents (no API calls, data-only)
// ---------------------------------------------------------------------------

function agent15_sourceAttribution(results: AgentResult[]): AgentResult {
  const ga4Sources = results.find((r) => r.agent === 2);
  const adsCampaign = results.find((r) => r.agent === 9);

  if (ga4Sources?.status !== "ok" || adsCampaign?.status !== "ok") {
    return { agent: 15, name: "Source Attribution", status: "empty", data: { message: "Insufficient data from agents 2 and 9" } };
  }

  // Find google/cpc sessions from GA4
  const ga4Data = ga4Sources.data as GA4ReportResponse;
  let ga4PaidSessions = 0;
  for (const row of ga4Data.rows || []) {
    const source = row.dimensionValues[0]?.value?.toLowerCase() || "";
    const medium = row.dimensionValues[1]?.value?.toLowerCase() || "";
    if ((source.includes("google") || source === "(not set)") && (medium === "cpc" || medium === "paid")) {
      ga4PaidSessions += parseInt(row.metricValues[0]?.value || "0", 10);
    }
  }

  // Get total clicks from Ads
  const adsData = adsCampaign.data as Array<{ metrics?: { clicks?: string } }>;
  let totalAdsClicks = 0;
  for (const row of adsData) {
    totalAdsClicks += parseInt(row.metrics?.clicks || "0", 10);
  }

  const clickLossRate = totalAdsClicks > 0
    ? ((1 - ga4PaidSessions / totalAdsClicks) * 100).toFixed(1)
    : "N/A";

  return {
    agent: 15,
    name: "Source Attribution",
    status: "ok",
    data: {
      adsClicks: totalAdsClicks,
      ga4PaidSessions,
      clickLossRate: clickLossRate === "N/A" ? clickLossRate : `${clickLossRate}%`,
      note: "Click loss is normal (10-20%): bot filtering, page abandonment, tracking gaps",
    },
  };
}

function agent16_pageQuality(results: AgentResult[]): AgentResult {
  const topPages = results.find((r) => r.agent === 3);
  const userFlow = results.find((r) => r.agent === 6);
  const searchTerms = results.find((r) => r.agent === 11);

  if (topPages?.status !== "ok") {
    return { agent: 16, name: "Page Quality", status: "empty", data: { message: "Insufficient data from agents 3, 6, 11" } };
  }

  const pagesData = topPages.data as GA4ReportResponse;
  const highBouncePges: Array<{ page: string; bounceRate: number; views: number }> = [];

  for (const row of pagesData.rows || []) {
    const page = row.dimensionValues[0]?.value || "";
    const views = parseInt(row.metricValues[0]?.value || "0", 10);
    const bounceRate = parseFloat(row.metricValues[2]?.value || "0");
    if (bounceRate > 0.7 && views > 5) {
      highBouncePges.push({ page, bounceRate: Math.round(bounceRate * 100), views });
    }
  }

  // Correlate landing pages from user flow
  const flowData = userFlow?.data as GA4ReportResponse | undefined;
  const paidLandings: Array<{ page: string; source: string; bounceRate: number; sessions: number }> = [];
  for (const row of flowData?.rows || []) {
    const page = row.dimensionValues[0]?.value || "";
    const source = row.dimensionValues[1]?.value || "";
    const sessions = parseInt(row.metricValues[0]?.value || "0", 10);
    const bounceRate = parseFloat(row.metricValues[1]?.value || "0");
    if (source.toLowerCase().includes("google")) {
      paidLandings.push({ page, source, bounceRate: Math.round(bounceRate * 100), sessions });
    }
  }

  // Top search terms for context
  const termsData = searchTerms?.data as Array<{ searchTermView?: { searchTerm?: string }; metrics?: { clicks?: string } }> | undefined;
  const topTerms = (termsData || []).slice(0, 10).map((r) => ({
    term: r.searchTermView?.searchTerm || "",
    clicks: parseInt(r.metrics?.clicks || "0", 10),
  }));

  return {
    agent: 16,
    name: "Page Quality",
    status: "ok",
    data: { highBouncePages: highBouncePges, paidLandings, topSearchTerms: topTerms },
  };
}

// ---------------------------------------------------------------------------
// Recommendation engine
// ---------------------------------------------------------------------------

function generateRecommendations(results: AgentResult[]): Recommendation[] {
  const recs: Recommendation[] = [];

  // Check conversion tracking (Agent 7)
  const events = results.find((r) => r.agent === 7);
  if (events?.status === "ok") {
    const eventsData = events.data as GA4ReportResponse;
    const eventNames = (eventsData.rows || []).map((r) => r.dimensionValues[0]?.value || "");
    const hasConversions = eventNames.some((n) =>
      ["purchase", "sign_up", "generate_lead", "begin_checkout", "conversion"].includes(n),
    );
    if (!hasConversions) {
      recs.push({
        priority: "HIGH",
        category: "Tracking",
        message: "No conversion events detected in GA4. Set up key events (sign_up, purchase, generate_lead) to measure campaign ROI.",
      });
    }
  }

  // Negative keywords (Agent 11)
  const searchTerms = results.find((r) => r.agent === 11);
  if (searchTerms?.status === "ok") {
    const terms = searchTerms.data as Array<{
      searchTermView?: { searchTerm?: string };
      metrics?: { clicks?: string; conversions?: string; costMicros?: string };
    }>;
    const negCandidates: string[] = [];
    for (const row of terms) {
      const clicks = parseInt(row.metrics?.clicks || "0", 10);
      const conversions = parseFloat(row.metrics?.conversions || "0");
      const cost = parseInt(row.metrics?.costMicros || "0", 10) / 1_000_000;
      if (clicks > 0 && conversions === 0 && cost > 2) {
        negCandidates.push(row.searchTermView?.searchTerm || "");
      }
    }
    if (negCandidates.length > 0) {
      recs.push({
        priority: "HIGH",
        category: "Negative Keywords",
        message: `${negCandidates.length} search terms with clicks but no conversions and >$2 cost. Consider adding as negatives: ${negCandidates.slice(0, 5).map((t) => `"${t}"`).join(", ")}${negCandidates.length > 5 ? ` (+${negCandidates.length - 5} more)` : ""}`,
      });
    }
  }

  // Device bids (Agent 12)
  const devices = results.find((r) => r.agent === 12);
  if (devices?.status === "ok") {
    const devData = devices.data as Array<{ segments?: { device?: string }; metrics?: { ctr?: string; clicks?: string } }>;
    const deviceMap: Record<string, { ctr: number; clicks: number }> = {};
    for (const row of devData) {
      const dev = row.segments?.device || "UNKNOWN";
      const ctr = parseFloat(row.metrics?.ctr || "0");
      const clicks = parseInt(row.metrics?.clicks || "0", 10);
      deviceMap[dev] = { ctr, clicks };
    }
    const desktop = deviceMap["DESKTOP"];
    const mobile = deviceMap["MOBILE"];
    if (desktop && mobile && desktop.ctr > mobile.ctr * 2 && desktop.clicks > 5) {
      recs.push({
        priority: "MEDIUM",
        category: "Device Bids",
        message: `Desktop CTR (${(desktop.ctr * 100).toFixed(1)}%) is >2x mobile (${(mobile.ctr * 100).toFixed(1)}%). Consider +20% desktop bid adjustment.`,
      });
    }
    if (mobile && desktop && mobile.ctr > desktop.ctr * 2 && mobile.clicks > 5) {
      recs.push({
        priority: "MEDIUM",
        category: "Device Bids",
        message: `Mobile CTR (${(mobile.ctr * 100).toFixed(1)}%) is >2x desktop (${(desktop.ctr * 100).toFixed(1)}%). Consider +20% mobile bid adjustment.`,
      });
    }
  }

  // Network allocation (Agent 13)
  const networks = results.find((r) => r.agent === 13);
  if (networks?.status === "ok") {
    const netData = networks.data as Array<{
      segments?: { adNetworkType?: string };
      metrics?: { ctr?: string; costMicros?: string; impressions?: string };
    }>;
    let totalCost = 0;
    const netMap: Record<string, { ctr: number; cost: number; impressions: number }> = {};
    for (const row of netData) {
      const net = row.segments?.adNetworkType || "UNKNOWN";
      const cost = parseInt(row.metrics?.costMicros || "0", 10) / 1_000_000;
      const ctr = parseFloat(row.metrics?.ctr || "0");
      const impressions = parseInt(row.metrics?.impressions || "0", 10);
      netMap[net] = { ctr, cost, impressions };
      totalCost += cost;
    }
    for (const [net, vals] of Object.entries(netMap)) {
      const costShare = totalCost > 0 ? vals.cost / totalCost : 0;
      if (vals.ctr < 0.005 && costShare > 0.3) {
        recs.push({
          priority: "MEDIUM",
          category: "Network Allocation",
          message: `${net} has CTR ${(vals.ctr * 100).toFixed(2)}% but ${(costShare * 100).toFixed(0)}% of spend. Consider reducing exposure.`,
        });
      }
    }
  }

  // Demographics (Agent 14)
  const demo = results.find((r) => r.agent === 14);
  if (demo?.status === "ok") {
    const { age } = demo.data as { gender: unknown[]; age: Array<{ adGroupCriterion?: { ageRange?: { type?: string } }; metrics?: { ctr?: string } }> };
    if (age.length > 1) {
      const avgCtr = age.reduce((sum, r) => sum + parseFloat(r.metrics?.ctr || "0"), 0) / age.length;
      for (const row of age) {
        const ageType = row.adGroupCriterion?.ageRange?.type || "UNKNOWN";
        const ctr = parseFloat(row.metrics?.ctr || "0");
        if (ctr > avgCtr * 1.5) {
          recs.push({
            priority: "LOW",
            category: "Audience",
            message: `Age range ${ageType} CTR (${(ctr * 100).toFixed(1)}%) is significantly above average. Consider positive bid adjustment.`,
          });
        }
      }
    }
  }

  // Landing page quality (Agent 16)
  const pageQuality = results.find((r) => r.agent === 16);
  if (pageQuality?.status === "ok") {
    const pqData = pageQuality.data as { highBouncePages: Array<{ page: string; bounceRate: number; views: number }> };
    for (const pg of pqData.highBouncePages.slice(0, 3)) {
      recs.push({
        priority: "MEDIUM",
        category: "Landing Page",
        message: `${pg.page} has ${pg.bounceRate}% bounce rate (${pg.views} views). Optimize for relevance and load speed.`,
      });
    }
  }

  // Source attribution (Agent 15)
  const attribution = results.find((r) => r.agent === 15);
  if (attribution?.status === "ok") {
    const attrData = attribution.data as { clickLossRate: string; adsClicks: number };
    const lossNum = parseFloat(attrData.clickLossRate);
    if (!isNaN(lossNum) && lossNum > 30) {
      recs.push({
        priority: "HIGH",
        category: "Tracking",
        message: `Click loss rate is ${attrData.clickLossRate} (${attrData.adsClicks} ad clicks). Verify GA4 tag fires on all landing pages and check for redirect chains.`,
      });
    }
  }

  // Campaign age (always relevant at day 1)
  const campaign = results.find((r) => r.agent === 9);
  if (campaign?.status === "ok") {
    const campData = campaign.data as Array<{ metrics?: { impressions?: string; costMicros?: string } }>;
    const totalSpend = campData.reduce((s, r) => s + parseInt(r.metrics?.costMicros || "0", 10), 0) / 1_000_000;
    const totalImpressions = campData.reduce((s, r) => s + parseInt(r.metrics?.impressions || "0", 10), 0);
    if (totalSpend < 50 * DAYS * 0.7) {
      recs.push({
        priority: "LOW",
        category: "Budget",
        message: `Under-pacing: $${totalSpend.toFixed(2)} spent vs $${(50 * DAYS).toFixed(0)} budget (${DAYS} days). Expected during PMax learning phase (2-4 weeks).`,
      });
    }
    if (totalImpressions < 100) {
      recs.push({
        priority: "LOW",
        category: "Learning Phase",
        message: `Only ${totalImpressions} impressions. PMax is still in learning phase — avoid making changes for 2 weeks.`,
      });
    }
  }

  // Geography validation (Agent 5)
  const geo = results.find((r) => r.agent === 5);
  if (geo?.status === "ok") {
    const geoData = geo.data as GA4ReportResponse;
    let ukSessions = 0;
    let totalSessions = 0;
    for (const row of geoData.rows || []) {
      const country = row.dimensionValues[0]?.value || "";
      const sessions = parseInt(row.metricValues[0]?.value || "0", 10);
      totalSessions += sessions;
      if (country === "United Kingdom") ukSessions += sessions;
    }
    const ukShare = totalSessions > 0 ? (ukSessions / totalSessions * 100).toFixed(0) : "0";
    if (totalSessions > 10 && parseInt(ukShare) < 50) {
      recs.push({
        priority: "MEDIUM",
        category: "Geo Targeting",
        message: `Only ${ukShare}% of sessions from UK (target market). Check location targeting settings in Google Ads.`,
      });
    }
  }

  // Sort by priority
  const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recs;
}

// ---------------------------------------------------------------------------
// Report formatting
// ---------------------------------------------------------------------------

function micros(val: string | undefined): string {
  return (parseInt(val || "0", 10) / 1_000_000).toFixed(2);
}

function pct(val: string | undefined): string {
  return (parseFloat(val || "0") * 100).toFixed(2);
}

function formatMarkdownReport(results: AgentResult[], recs: Recommendation[]): string {
  const lines: string[] = [];
  const p = (s: string) => lines.push(s);

  p("# Google Analytics + Google Ads Analysis Report");
  p(`\n**Date range:** ${START} to ${END} (${DAYS} days)`);
  p(`**Generated:** ${new Date().toISOString()}`);

  // Executive Summary
  p("\n## 1. Executive Summary\n");
  const campaign = results.find((r) => r.agent === 9);
  if (campaign?.status === "ok") {
    const campData = campaign.data as Array<{
      campaign?: { name?: string; status?: string };
      metrics?: { impressions?: string; clicks?: string; costMicros?: string; ctr?: string; averageCpc?: string; conversions?: string };
    }>;
    for (const row of campData) {
      p(`- **Campaign:** ${row.campaign?.name || "N/A"} [${row.campaign?.status || "N/A"}]`);
      p(`- **Spend:** $${micros(row.metrics?.costMicros)} | **Clicks:** ${row.metrics?.clicks || 0} | **CTR:** ${pct(row.metrics?.ctr)}%`);
      p(`- **Avg CPC:** $${micros(row.metrics?.averageCpc)} | **Conversions:** ${parseFloat(row.metrics?.conversions || "0").toFixed(1)}`);
    }
  } else {
    p("*No PMax campaign data available yet.*");
  }

  const attribution = results.find((r) => r.agent === 15);
  if (attribution?.status === "ok") {
    const attrData = attribution.data as { adsClicks: number; ga4PaidSessions: number; clickLossRate: string };
    p(`- **Attribution:** ${attrData.adsClicks} ad clicks → ${attrData.ga4PaidSessions} GA4 sessions (${attrData.clickLossRate} loss)`);
  }

  // GA4 Traffic Analysis
  p("\n## 2. GA4 Traffic Analysis\n");

  // Agent 1: Traffic Overview
  const traffic = results.find((r) => r.agent === 1);
  p("### Traffic Overview (Agent 1)\n");
  if (traffic?.status === "ok") {
    const td = traffic.data as GA4ReportResponse;
    p("| Date | Sessions | Active Users | Page Views | Bounce Rate | Avg Duration | New Users |");
    p("|------|----------|-------------|------------|-------------|-------------|-----------|");
    for (const row of (td.rows || []).slice(0, 14)) {
      const d = row.dimensionValues.map((v) => v.value);
      const m = row.metricValues.map((v) => v.value);
      p(`| ${d[0]} | ${m[0]} | ${m[1]} | ${m[2]} | ${pct(m[3])}% | ${parseFloat(m[4] || "0").toFixed(0)}s | ${m[5]} |`);
    }
  } else {
    p("*No traffic data available.*");
  }

  // Agent 2: Sources
  const sources = results.find((r) => r.agent === 2);
  p("\n### Traffic Sources (Agent 2)\n");
  if (sources?.status === "ok") {
    const sd = sources.data as GA4ReportResponse;
    p("| Source | Medium | Sessions | Active Users | Bounce Rate |");
    p("|--------|--------|----------|-------------|-------------|");
    for (const row of (sd.rows || []).slice(0, 15)) {
      const d = row.dimensionValues.map((v) => v.value);
      const m = row.metricValues.map((v) => v.value);
      p(`| ${d[0]} | ${d[1]} | ${m[0]} | ${m[1]} | ${pct(m[2])}% |`);
    }
  } else {
    p("*No source data available.*");
  }

  // Agent 3: Pages
  const pages = results.find((r) => r.agent === 3);
  p("\n### Top Pages (Agent 3)\n");
  if (pages?.status === "ok") {
    const pd = pages.data as GA4ReportResponse;
    p("| Page | Views | Users | Bounce Rate | Avg Duration |");
    p("|------|-------|-------|-------------|-------------|");
    for (const row of (pd.rows || []).slice(0, 15)) {
      const d = row.dimensionValues.map((v) => v.value);
      const m = row.metricValues.map((v) => v.value);
      p(`| ${d[0]} | ${m[0]} | ${m[1]} | ${pct(m[2])}% | ${parseFloat(m[3] || "0").toFixed(0)}s |`);
    }
  } else {
    p("*No page data available.*");
  }

  // Agent 4: Devices
  const devs = results.find((r) => r.agent === 4);
  p("\n### Devices (Agent 4)\n");
  if (devs?.status === "ok") {
    const dd = devs.data as GA4ReportResponse;
    p("| Device | OS | Browser | Sessions | Bounce Rate |");
    p("|--------|-----|---------|----------|-------------|");
    for (const row of (dd.rows || []).slice(0, 15)) {
      const d = row.dimensionValues.map((v) => v.value);
      const m = row.metricValues.map((v) => v.value);
      p(`| ${d[0]} | ${d[1]} | ${d[2]} | ${m[0]} | ${pct(m[2])}% |`);
    }
  } else {
    p("*No device data available.*");
  }

  // Agent 5: Geography
  const geoRes = results.find((r) => r.agent === 5);
  p("\n### Geography (Agent 5)\n");
  if (geoRes?.status === "ok") {
    const gd = geoRes.data as GA4ReportResponse;
    p("| Country | City | Sessions | Active Users | Bounce Rate |");
    p("|---------|------|----------|-------------|-------------|");
    for (const row of (gd.rows || []).slice(0, 15)) {
      const d = row.dimensionValues.map((v) => v.value);
      const m = row.metricValues.map((v) => v.value);
      p(`| ${d[0]} | ${d[1]} | ${m[0]} | ${m[1]} | ${pct(m[2])}% |`);
    }
  } else {
    p("*No geographic data available.*");
  }

  // Agent 6: User Flow
  const flow = results.find((r) => r.agent === 6);
  p("\n### User Flow (Agent 6)\n");
  if (flow?.status === "ok") {
    const fd = flow.data as GA4ReportResponse;
    p("| Landing Page | Source | Sessions | Bounce Rate | Avg Duration | Pages/Session |");
    p("|-------------|--------|----------|-------------|-------------|---------------|");
    for (const row of (fd.rows || []).slice(0, 15)) {
      const d = row.dimensionValues.map((v) => v.value);
      const m = row.metricValues.map((v) => v.value);
      p(`| ${d[0]} | ${d[1]} | ${m[0]} | ${pct(m[1])}% | ${parseFloat(m[2] || "0").toFixed(0)}s | ${parseFloat(m[3] || "0").toFixed(1)} |`);
    }
  } else {
    p("*No user flow data available.*");
  }

  // Agent 7: Events
  const evts = results.find((r) => r.agent === 7);
  p("\n### Events & Conversions (Agent 7)\n");
  if (evts?.status === "ok") {
    const ed = evts.data as GA4ReportResponse;
    p("| Event Name | Count | Users |");
    p("|-----------|-------|-------|");
    for (const row of (ed.rows || []).slice(0, 20)) {
      const d = row.dimensionValues.map((v) => v.value);
      const m = row.metricValues.map((v) => v.value);
      p(`| ${d[0]} | ${m[0]} | ${m[1]} |`);
    }
  } else {
    p("*No event data available.*");
  }

  // Agent 8: Realtime
  const rt = results.find((r) => r.agent === 8);
  p("\n### Realtime (Agent 8)\n");
  if (rt?.status === "ok") {
    const rd = rt.data as GA4ReportResponse;
    p("| Country | Device | Active Users |");
    p("|---------|--------|-------------|");
    for (const row of (rd.rows || []).slice(0, 10)) {
      const d = row.dimensionValues.map((v) => v.value);
      const m = row.metricValues.map((v) => v.value);
      p(`| ${d[0]} | ${d[1]} | ${m[0]} |`);
    }
  } else {
    p("*No realtime users.*");
  }

  // Google Ads Performance
  p("\n## 3. Google Ads Performance\n");

  // Agent 9: Campaign (already in executive summary)
  p("### Campaign Overview (Agent 9)\n");
  p("*See Executive Summary above.*");

  // Agent 10: Daily Trend
  const daily = results.find((r) => r.agent === 10);
  p("\n### Daily Trend (Agent 10)\n");
  if (daily?.status === "ok") {
    const dd = daily.data as Array<{
      segments?: { date?: string };
      metrics?: { impressions?: string; clicks?: string; costMicros?: string; ctr?: string; averageCpc?: string; conversions?: string };
    }>;
    p("| Date | Impressions | Clicks | Cost | CTR | CPC | Conversions |");
    p("|------|------------|--------|------|-----|-----|------------|");
    for (const row of dd) {
      const m = row.metrics;
      p(`| ${row.segments?.date || ""} | ${m?.impressions || 0} | ${m?.clicks || 0} | $${micros(m?.costMicros)} | ${pct(m?.ctr)}% | $${micros(m?.averageCpc)} | ${parseFloat(m?.conversions || "0").toFixed(1)} |`);
    }
  } else {
    p("*No daily trend data available.*");
  }

  // Agent 11: Search Terms
  const terms = results.find((r) => r.agent === 11);
  p("\n### Search Terms (Agent 11)\n");
  if (terms?.status === "ok") {
    const td = terms.data as Array<{
      searchTermView?: { searchTerm?: string };
      metrics?: { impressions?: string; clicks?: string; costMicros?: string; conversions?: string; ctr?: string };
    }>;
    p("| Search Term | Impressions | Clicks | Cost | Conversions | CTR |");
    p("|------------|------------|--------|------|------------|-----|");
    for (const row of td.slice(0, 30)) {
      const m = row.metrics;
      p(`| ${row.searchTermView?.searchTerm || ""} | ${m?.impressions || 0} | ${m?.clicks || 0} | $${micros(m?.costMicros)} | ${parseFloat(m?.conversions || "0").toFixed(1)} | ${pct(m?.ctr)}% |`);
    }
  } else {
    p("*No search term data yet.*");
  }

  // Agent 12: Device Split
  const devSplit = results.find((r) => r.agent === 12);
  p("\n### Device Split (Agent 12)\n");
  if (devSplit?.status === "ok") {
    const dd = devSplit.data as Array<{
      segments?: { device?: string };
      metrics?: { impressions?: string; clicks?: string; costMicros?: string; ctr?: string; averageCpc?: string; conversions?: string };
    }>;
    p("| Device | Impressions | Clicks | Cost | CTR | CPC | Conversions |");
    p("|--------|------------|--------|------|-----|-----|------------|");
    for (const row of dd) {
      const m = row.metrics;
      p(`| ${row.segments?.device || ""} | ${m?.impressions || 0} | ${m?.clicks || 0} | $${micros(m?.costMicros)} | ${pct(m?.ctr)}% | $${micros(m?.averageCpc)} | ${parseFloat(m?.conversions || "0").toFixed(1)} |`);
    }
  } else {
    p("*No device split data available.*");
  }

  // Agent 13: Network Split
  const netSplit = results.find((r) => r.agent === 13);
  p("\n### Network Split (Agent 13)\n");
  if (netSplit?.status === "ok") {
    const nd = netSplit.data as Array<{
      segments?: { adNetworkType?: string };
      metrics?: { impressions?: string; clicks?: string; costMicros?: string; ctr?: string; conversions?: string };
    }>;
    p("| Network | Impressions | Clicks | Cost | CTR | Conversions |");
    p("|---------|------------|--------|------|-----|------------|");
    for (const row of nd) {
      const m = row.metrics;
      p(`| ${row.segments?.adNetworkType || ""} | ${m?.impressions || 0} | ${m?.clicks || 0} | $${micros(m?.costMicros)} | ${pct(m?.ctr)}% | ${parseFloat(m?.conversions || "0").toFixed(1)} |`);
    }
  } else {
    p("*No network split data available.*");
  }

  // Agent 14: Demographics
  const demoRes = results.find((r) => r.agent === 14);
  p("\n### Demographics (Agent 14)\n");
  if (demoRes?.status === "ok") {
    const { gender, age } = demoRes.data as {
      gender: Array<{ adGroupCriterion?: { gender?: { type?: string } }; metrics?: { impressions?: string; clicks?: string; costMicros?: string; ctr?: string } }>;
      age: Array<{ adGroupCriterion?: { ageRange?: { type?: string } }; metrics?: { impressions?: string; clicks?: string; costMicros?: string; ctr?: string } }>;
    };

    if (gender.length) {
      p("**Gender:**\n");
      p("| Gender | Impressions | Clicks | Cost | CTR |");
      p("|--------|------------|--------|------|-----|");
      for (const row of gender) {
        const m = row.metrics;
        p(`| ${row.adGroupCriterion?.gender?.type || ""} | ${m?.impressions || 0} | ${m?.clicks || 0} | $${micros(m?.costMicros)} | ${pct(m?.ctr)}% |`);
      }
    }
    if (age.length) {
      p("\n**Age Range:**\n");
      p("| Age Range | Impressions | Clicks | Cost | CTR |");
      p("|-----------|------------|--------|------|-----|");
      for (const row of age) {
        const m = row.metrics;
        p(`| ${row.adGroupCriterion?.ageRange?.type || ""} | ${m?.impressions || 0} | ${m?.clicks || 0} | $${micros(m?.costMicros)} | ${pct(m?.ctr)}% |`);
      }
    }
    if (!gender.length && !age.length) {
      p("*No demographic data available.*");
    }
  } else {
    p("*No demographic data available.*");
  }

  // Cross-Reference Insights
  p("\n## 4. Cross-Reference Insights\n");

  // Agent 15: Attribution
  p("### Source Attribution (Agent 15)\n");
  if (attribution?.status === "ok") {
    const ad = attribution.data as { adsClicks: number; ga4PaidSessions: number; clickLossRate: string; note: string };
    p(`- **Ad Clicks:** ${ad.adsClicks}`);
    p(`- **GA4 Paid Sessions:** ${ad.ga4PaidSessions}`);
    p(`- **Click Loss Rate:** ${ad.clickLossRate}`);
    p(`- *${ad.note}*`);
  } else {
    p("*Insufficient data for attribution analysis.*");
  }

  // Agent 16: Page Quality
  const pq = results.find((r) => r.agent === 16);
  p("\n### Page Quality (Agent 16)\n");
  if (pq?.status === "ok") {
    const pqd = pq.data as {
      highBouncePages: Array<{ page: string; bounceRate: number; views: number }>;
      paidLandings: Array<{ page: string; source: string; bounceRate: number; sessions: number }>;
      topSearchTerms: Array<{ term: string; clicks: number }>;
    };

    if (pqd.highBouncePages.length) {
      p("**High Bounce Pages (>70%):**\n");
      p("| Page | Bounce Rate | Views |");
      p("|------|------------|-------|");
      for (const pg of pqd.highBouncePages) {
        p(`| ${pg.page} | ${pg.bounceRate}% | ${pg.views} |`);
      }
    }
    if (pqd.paidLandings.length) {
      p("\n**Paid Landing Pages (Google source):**\n");
      p("| Page | Source | Bounce Rate | Sessions |");
      p("|------|--------|------------|----------|");
      for (const pl of pqd.paidLandings) {
        p(`| ${pl.page} | ${pl.source} | ${pl.bounceRate}% | ${pl.sessions} |`);
      }
    }
    if (pqd.topSearchTerms.length) {
      p("\n**Top Search Terms driving traffic:**\n");
      p("| Term | Clicks |");
      p("|------|--------|");
      for (const t of pqd.topSearchTerms) {
        p(`| ${t.term} | ${t.clicks} |`);
      }
    }
    if (!pqd.highBouncePages.length && !pqd.paidLandings.length && !pqd.topSearchTerms.length) {
      p("*No notable page quality issues detected.*");
    }
  } else {
    p("*Insufficient data for page quality analysis.*");
  }

  // Recommendations
  p("\n## 5. Prioritized Recommendations\n");
  if (recs.length === 0) {
    p("*No actionable recommendations at this time. Campaign may be too new for meaningful analysis.*");
  } else {
    for (const rec of recs) {
      const icon = rec.priority === "HIGH" ? "**[HIGH]**" : rec.priority === "MEDIUM" ? "[MEDIUM]" : "[LOW]";
      p(`- ${icon} **${rec.category}:** ${rec.message}`);
    }
  }

  // Status summary
  p("\n---\n");
  const okCount = results.filter((r) => r.status === "ok").length;
  const emptyCount = results.filter((r) => r.status === "empty").length;
  const errCount = results.filter((r) => r.status === "error").length;
  p(`*16 agents: ${okCount} with data, ${emptyCount} empty, ${errCount} errors*`);

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.error("Starting 16-agent analysis...");
  console.error(`Date range: ${START} to ${END} (${DAYS} days)\n`);

  // Pre-warm auth tokens to avoid concurrent refresh race conditions
  console.error("Pre-warming auth tokens...");
  await gaAuth.getAccessToken();
  console.error("  GA4 token ready");

  // Phase 1: Run agents 1-14 in parallel
  console.error("Phase 1: Running 14 API queries in parallel...");
  const phase1 = await Promise.allSettled([
    agent1_trafficOverview(),
    agent2_trafficSources(),
    agent3_topPages(),
    agent4_devices(),
    agent5_geography(),
    agent6_userFlow(),
    agent7_events(),
    agent8_realtime(),
    agent9_campaignOverview(),
    agent10_dailyTrend(),
    agent11_searchTerms(),
    agent12_deviceSplit(),
    agent13_networkSplit(),
    agent14_demographics(),
  ]);

  const phase1Results: AgentResult[] = phase1.map((r, i) => {
    if (r.status === "fulfilled") {
      console.error(`  Agent ${r.value.agent} (${r.value.name}): ${r.value.status}`);
      return r.value;
    }
    const name = [
      "Traffic Overview", "Traffic Sources", "Top Pages", "Devices",
      "Geography", "User Flow", "Events & Conversions", "Realtime",
      "Campaign Overview", "Daily Trend", "Search Terms", "Device Split",
      "Network Split", "Demographics",
    ][i];
    console.error(`  Agent ${i + 1} (${name}): ERROR - ${r.reason}`);
    return { agent: i + 1, name: name!, status: "error" as const, data: null, error: String(r.reason) };
  });

  // Phase 2: Cross-reference agents
  console.error("\nPhase 2: Running 2 cross-reference analyses...");
  const xref15 = agent15_sourceAttribution(phase1Results);
  const xref16 = agent16_pageQuality(phase1Results);
  console.error(`  Agent 15 (${xref15.name}): ${xref15.status}`);
  console.error(`  Agent 16 (${xref16.name}): ${xref16.status}`);

  const allResults = [...phase1Results, xref15, xref16];

  // Phase 3: Generate recommendations
  console.error("\nPhase 3: Generating recommendations...");
  const recommendations = generateRecommendations(allResults);
  console.error(`  ${recommendations.length} recommendations generated\n`);

  // Phase 4: Output report
  if (jsonOutput) {
    const jsonReport = {
      dateRange: { start: START, end: END, days: DAYS },
      generatedAt: new Date().toISOString(),
      agents: allResults.map((r) => ({
        agent: r.agent,
        name: r.name,
        status: r.status,
        data: r.data,
        ...(r.error ? { error: r.error } : {}),
      })),
      recommendations,
      summary: {
        agentsWithData: allResults.filter((r) => r.status === "ok").length,
        agentsEmpty: allResults.filter((r) => r.status === "empty").length,
        agentsError: allResults.filter((r) => r.status === "error").length,
        totalRecommendations: recommendations.length,
        highPriority: recommendations.filter((r) => r.priority === "HIGH").length,
        mediumPriority: recommendations.filter((r) => r.priority === "MEDIUM").length,
        lowPriority: recommendations.filter((r) => r.priority === "LOW").length,
      },
    };
    console.log(JSON.stringify(jsonReport, null, 2));
  } else {
    console.log(formatMarkdownReport(allResults, recommendations));
  }

  console.error("Done.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
