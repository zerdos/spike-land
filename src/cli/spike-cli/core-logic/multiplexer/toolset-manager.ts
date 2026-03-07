/**
 * ToolsetManager: manages lazy-loading of groups of MCP servers (toolsets).
 */

import type { ToolsetConfig } from "../config/types.js";
import type { DynamicToolRegistry } from "../chat/tool-registry.js";

export interface ToolDefinitionMeta {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ToolsetListEntry {
  name: string;
  description: string;
  loaded: boolean;
  servers: string[];
  toolCount: number;
}

export interface ToolCallResult {
  content: Array<{ type: string; text: string }>;
  isError?: true;
}

export class ToolsetManager {
  private toolsets: Record<string, ToolsetConfig>;
  private loadedToolsets: Set<string> = new Set();
  private toolCountFn: (serverName: string) => number;
  /** Optional dynamic tool registry for tool_search/tool_catalog meta-tools. */
  registry?: DynamicToolRegistry;

  /**
   * @param toolsets - Map of toolset name to config (servers + description).
   * @param toolCountFn - Called to get the current tool count for a server.
   */
  constructor(
    toolsets: Record<string, ToolsetConfig>,
    toolCountFn: (serverName: string) => number = () => 0,
  ) {
    this.toolsets = toolsets;
    this.toolCountFn = toolCountFn;
  }

  /** Returns true if the server's tools should be included in the unified tool list. */
  isServerVisible(serverName: string): boolean {
    // If the server is not in any toolset, always visible.
    for (const [name, config] of Object.entries(this.toolsets)) {
      if (config.servers.includes(serverName)) {
        // Server is in a toolset — only visible if that toolset is loaded.
        return this.loadedToolsets.has(name);
      }
    }
    return true;
  }

  loadToolset(name: string): { loaded: string[]; toolCount: number } {
    const config = this.toolsets[name];
    if (!config) throw new Error(`Unknown toolset: ${name}`);
    this.loadedToolsets.add(name);
    const toolCount = config.servers.reduce((sum, s) => sum + this.toolCountFn(s), 0);
    return { loaded: config.servers, toolCount };
  }

  unloadToolset(name: string): void {
    const config = this.toolsets[name];
    if (!config) throw new Error(`Unknown toolset: ${name}`);
    this.loadedToolsets.delete(name);
  }

  listToolsets(): ToolsetListEntry[] {
    return Object.entries(this.toolsets).map(([name, config]) => ({
      name,
      description: config.description ?? "",
      loaded: this.loadedToolsets.has(name),
      servers: config.servers,
      toolCount: config.servers.reduce((sum, s) => sum + this.toolCountFn(s), 0),
    }));
  }

  getMetaTools(): ToolDefinitionMeta[] {
    const tools: ToolDefinitionMeta[] = [
      {
        name: "spike__list_toolsets",
        description: "List available toolsets and their load status",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "spike__load_toolset",
        description: "Load a toolset by name to expose its tools",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Toolset name to load" },
          },
          required: ["name"],
        },
      },
      {
        name: "spike__unload_toolset",
        description: "Unload a toolset by name to hide its tools",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Toolset name to unload" },
          },
          required: ["name"],
        },
      },
    ];

    // Add tool_search and tool_catalog when registry is available
    if (this.registry) {
      tools.push(
        {
          name: "spike__tool_search",
          description:
            "Search for tools by keyword. Returns matching tool names and their full schemas. Activates them for use.",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query (tool name, keyword, or description fragment)",
              },
              max_results: {
                type: "number",
                description: "Maximum results to return (default: 5)",
              },
            },
            required: ["query"],
          },
        },
        {
          name: "spike__tool_catalog",
          description:
            "Show the full catalog of all available tools grouped by server, with one-line descriptions.",
          inputSchema: { type: "object", properties: {} },
        },
      );
    }

    return tools;
  }

  isMetaTool(name: string): boolean {
    return (
      name === "spike__list_toolsets" ||
      name === "spike__load_toolset" ||
      name === "spike__unload_toolset" ||
      name === "spike__tool_search" ||
      name === "spike__tool_catalog"
    );
  }

  handleMetaTool(name: string, args: Record<string, unknown>): ToolCallResult {
    if (name === "spike__list_toolsets") {
      return {
        content: [{ type: "text", text: JSON.stringify(this.listToolsets()) }],
      };
    }

    if (name === "spike__load_toolset") {
      const toolsetName = args.name;
      if (typeof toolsetName !== "string") {
        return {
          content: [{ type: "text", text: "name is required" }],
          isError: true,
        };
      }
      try {
        const result = this.loadToolset(toolsetName);
        return {
          content: [
            {
              type: "text",
              text: `Loaded toolset "${toolsetName}": ${result.loaded.join(
                ", ",
              )} (${result.toolCount} tools)`,
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: String(err instanceof Error ? err.message : err),
            },
          ],
          isError: true,
        };
      }
    }

    if (name === "spike__unload_toolset") {
      const toolsetName = args.name;
      if (typeof toolsetName !== "string") {
        return {
          content: [{ type: "text", text: "name is required" }],
          isError: true,
        };
      }
      const config = this.toolsets[toolsetName];
      if (!config) {
        return {
          content: [{ type: "text", text: `Unknown toolset: ${toolsetName}` }],
          isError: true,
        };
      }
      if (!this.loadedToolsets.has(toolsetName)) {
        return {
          content: [
            {
              type: "text",
              text: `Toolset "${toolsetName}" is not currently loaded`,
            },
          ],
          isError: true,
        };
      }
      this.unloadToolset(toolsetName);
      return {
        content: [
          {
            type: "text",
            text: `Unloaded toolset "${toolsetName}": ${config.servers.join(", ")}`,
          },
        ],
      };
    }

    if (name === "spike__tool_search") {
      if (!this.registry) {
        return {
          content: [{ type: "text", text: "Dynamic tool registry not enabled" }],
          isError: true,
        };
      }
      const query = args.query;
      if (typeof query !== "string") {
        return {
          content: [{ type: "text", text: "query is required" }],
          isError: true,
        };
      }
      const maxResults = typeof args.max_results === "number" ? args.max_results : 5;
      const searchResult = this.registry.search(query, maxResults);
      const toolSchemas = searchResult.tools.map((t) => ({
        name: t.namespacedName,
        description: t.description,
        inputSchema: t.inputSchema,
      }));
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              query: searchResult.query,
              found: searchResult.tools.length,
              totalMatches: searchResult.totalMatches,
              tools: toolSchemas,
            }),
          },
        ],
      };
    }

    if (name === "spike__tool_catalog") {
      if (!this.registry) {
        return {
          content: [{ type: "text", text: "Dynamic tool registry not enabled" }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: this.registry.buildCatalog() }],
      };
    }

    return {
      content: [{ type: "text", text: `Unknown meta-tool: ${name}` }],
      isError: true,
    };
  }
}
