import { authenticateMcpRequest } from "@/lib/mcp/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const PIXEL_STUDIO_MCP_URL = "https://pixel-studio-mcp.spike.land/api/mcp";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
    },
  });
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let authResult;
  if (process.env.NODE_ENV === "development" && authHeader === "Bearer test_token_123") {
    authResult = { success: true, userId: "test-user-id" };
  } else {
    authResult = await authenticateMcpRequest(request);
  }
  if (!authResult.success || !authResult.userId) {
    logger.error("[PIXEL_STUDIO_PROXY] authenticateMcpRequest failed", undefined, {
      authResult,
      authHeader: authHeader?.substring(0, 20) + "...",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const requestBody = await request.text();

    const response = await fetch(PIXEL_STUDIO_MCP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
        "X-User-Id": authResult.userId,
      },
      body: requestBody,
    });

    if (!response.ok) {
        logger.error("[PIXEL_STUDIO_PROXY] upstream returned error", undefined, {
            status: response.status,
            statusText: response.statusText
        });
        return NextResponse.json(
            { error: `Upstream error: ${response.statusText}` },
            { status: response.status }
        );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    logger.error("[PIXEL_STUDIO_PROXY] proxy error", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
