import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
export interface RegisterFeedbackToolOptions {
  serviceName: string;
  toolName?: string;
  baseUrl?: string;
  description?: string;
}
export declare function registerFeedbackTool(
  server: McpServer,
  options: RegisterFeedbackToolOptions,
): void;
//# sourceMappingURL=feedback.d.ts.map
