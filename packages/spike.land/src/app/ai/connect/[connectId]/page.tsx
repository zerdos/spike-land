/**
 * Agent Connection Landing Page
 *
 * This page handles the browser-based authentication flow for Claude Code agents.
 * - If user is logged in: automatically connects agent and redirects to /agents/[agentId]
 * - If user is not logged in: shows QR code and prompts for sign in
 */

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { tryCatch } from "@/lib/try-catch";
import { redirect } from "next/navigation";
import { ConnectionContent } from "./connection-content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Connect Agent | spike.land",
  description: "Connect your Claude Code agent to spike.land",
};

interface PageProps {
  params: Promise<{ connectId: string; }>;
}

export default async function ConnectPage({ params }: PageProps) {
  const { connectId } = await params;

  // Fetch the connection request
  const { data: request, error } = await tryCatch(
    prisma.agentConnectionRequest.findUnique({
      where: { connectId },
    }),
  );

  // Check if request exists and is valid
  if (error || !request) {
    return (
      <ConnectionContent
        connectId={connectId}
        status="not_found"
        error="Connection request not found. Please run the agent script again."
      />
    );
  }

  // Check if expired
  if (request.expiresAt < new Date() && request.status !== "CONNECTED") {
    return (
      <ConnectionContent
        connectId={connectId}
        status="expired"
        error="Connection request expired. Please run the agent script again."
      />
    );
  }

  // Check if already connected
  if (request.status === "CONNECTED" && request.agentId) {
    redirect(`/agents/${request.agentId}`);
  }

  // Check if user is authenticated
  const session = await auth();

  if (session?.user?.id) {
    // User is logged in - show auto-connect UI
    const authDisplayName = request.displayName || undefined;
    const authProjectPath = request.projectPath || undefined;
    return (
      <ConnectionContent
        connectId={connectId}
        status="authenticated"
        {...(authDisplayName !== undefined ? { displayName: authDisplayName } : {})}
        {...(authProjectPath !== undefined ? { projectPath: authProjectPath } : {})}
        expiresAt={request.expiresAt.toISOString()}
      />
    );
  }

  // User is not logged in - show QR code and sign in prompt
  const pendingDisplayName = request.displayName || undefined;
  const pendingProjectPath = request.projectPath || undefined;
  return (
    <ConnectionContent
      connectId={connectId}
      status="pending"
      {...(pendingDisplayName !== undefined ? { displayName: pendingDisplayName } : {})}
      {...(pendingProjectPath !== undefined ? { projectPath: pendingProjectPath } : {})}
      expiresAt={request.expiresAt.toISOString()}
    />
  );
}
