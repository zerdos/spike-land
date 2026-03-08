import { Env } from "./env";

export async function checkWorkspaceMembership(
  env: Env,
  userId: string,
  workspaceId: string,
): Promise<boolean> {
  // Visitors are handled separately at the channel level depending on guestAccess settings
  if (userId.startsWith("visitor-")) {
    return true;
  }

  try {
    const res = await env.MCP_SERVICE.fetch(
      new Request(`https://mcp.spike.land/internal/workspaces/${workspaceId}/members/${userId}`),
    );

    if (res.status === 404) {
      return false; // Not a member
    }

    return res.ok;
  } catch (error) {
    console.error("Error checking workspace membership:", error);
    // Fail closed
    return false;
  }
}

export async function checkChannelAccess(
  env: Env,
  userId: string,
  channelId: string,
): Promise<boolean> {
  // TODO: Check if the user has access to the specific channel in D1
  return true;
}
