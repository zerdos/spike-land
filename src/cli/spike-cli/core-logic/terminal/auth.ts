import type { ChatClientOptions } from "../../ai/client";

export function resolveTerminalChatClientOptions(
  options: Pick<ChatClientOptions, "model">,
): ChatClientOptions {
  const authToken = process.env["CLAUDE_CODE_OAUTH_TOKEN"];
  const apiKey = process.env["ANTHROPIC_API_KEY"];

  if (!authToken && !apiKey) {
    throw new Error(
      "Terminal agent requires CLAUDE_CODE_OAUTH_TOKEN or ANTHROPIC_API_KEY in the environment",
    );
  }

  return {
    ...(authToken ? { authToken } : {}),
    ...(apiKey ? { apiKey } : {}),
    ...(options.model ? { model: options.model } : {}),
  };
}
