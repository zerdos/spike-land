import { PERSONAS } from "../src/code/@/lib/onboarding/personas.js";
import { spawnClaude } from "./bazdmeg/agent.js";
import * as fs from "node:fs";
import * as https from "node:https";

async function fetchTools(): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get("https://mcp.spike.land/tools", (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to fetch tools: ${res.statusCode}`));
          return;
        }
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

async function main() {
  console.log("🚀 Starting Multi-Agent MCP User Test for spike.land...");

  let toolsList = "";
  try {
    console.log("  [API] Fetching tools from https://mcp.spike.land/tools...");
    const rawData = await fetchTools();
    const data = JSON.parse(rawData);

    // Format tools for the prompt
    toolsList = data.tools
      .map(
        (t: any) => `
- **${t.name}** [Category: ${t.category || "uncategorized"}]
  Description: ${t.description}
  Input Schema: ${JSON.stringify(t.inputSchema || {})}
`,
      )
      .join("\n");
    console.log(`  [API] Successfully fetched ${data.tools.length} tools.`);
  } catch (err) {
    console.error("❌ Failed to fetch tools:", err);
    process.exit(1);
  }

  const results: string[] = [];
  const findings: any[] = [];

  for (const persona of PERSONAS) {
    console.log(`  [Agent] Running test for persona: ${persona.name} (${persona.slug})...`);

    const prompt = {
      id: `mcp-test-${persona.slug}`,
      role: "mcp-user-tester",
      render: (ctx: any) => `
You are a real user visiting spike.land, but instead of using a graphical interface, you are interacting with it exclusively through its MCP (Model Context Protocol) capabilities.
YOUR PERSONA:
- Name: ${persona.name}
- Description: ${persona.description}
- Goal: ${persona.heroText}
- Recommended Apps: ${persona.recommendedAppSlugs.join(", ")}

CONTEXT:
You have discovered the spike.land MCP server. The following is the list of MCP tools it provides to agents like you:

--- START TOOLS LIST ---
${ctx.toolsList}
--- END TOOLS LIST ---

TASK:
1. Analyze your reaction to this set of tools based on your persona. Does it address your needs? Does it feel powerful or overwhelming?
2. How proactively would you explore this MCP server? What specific tools would you want to try first and why?
3. List any issues, concerns, missing functionality, or points of confusion you have in a flat bulleted list.

Output your response in this exact format:

# Persona: ${persona.name}
## Reaction
<your qualitative reaction>

## Proactivity
<how you would explore and what you would use next>

## Issues & Concerns
- <issue 1>
- <issue 2>
...
`,
    };

    try {
      const output = spawnClaude(prompt as any, { toolsList } as any);
      results.push(output);

      const issuesMatch = output.match(/## Issues & Concerns\n([\s\S]+)/);
      if (issuesMatch) {
        findings.push({
          persona: persona.name,
          issues: issuesMatch[1]
            .trim()
            .split("\n")
            .map((line) => line.replace(/^- /, "").trim())
            .filter((line) => line.length > 0 && !line.startsWith("#")),
        });
      }
    } catch (err) {
      console.error(`❌ Failed to run test for ${persona.name}:`, err);
    }
  }

  console.log("📊 Generating MCP_USER_TEST_FINDINGS.md...");

  let summary = `# spike.land MCP User Test Findings Summary\n\n`;
  summary += `Tested with 16 diverse AI agent personas on ${new Date().toLocaleDateString()}.\n\n`;

  summary += `## Overview\n`;
  summary += `The agents explored the capabilities of spike.land via its public MCP tools endpoint and provided feedback based on their specific professional and personal backgrounds.\n\n`;

  summary += `## Aggregate Issues & Concerns\n`;
  const allIssues = new Set<string>();
  findings.forEach((f) => f.issues.forEach((i: string) => allIssues.add(`**${f.persona}**: ${i}`)));

  allIssues.forEach((issue) => {
    summary += `- ${issue}\n`;
  });

  summary += `\n## Individual Persona Reports\n\n`;
  summary += results.join("\n\n---\n\n");

  fs.writeFileSync("MCP_USER_TEST_FINDINGS.md", summary);
  console.log("✅ Done! Findings saved to MCP_USER_TEST_FINDINGS.md");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
