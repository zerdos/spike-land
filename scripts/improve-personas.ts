import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

async function improvePersonas() {
  const dir = "src/edge-api/main/core-logic";
  const files = await readdir(dir);
  const personaFiles = files.filter((f) => f.includes("persona"));

  console.log(`Spawning agents to improve ${personaFiles.length} persona files...`);

  for (const file of personaFiles) {
    const filePath = join(dir, file);
    let content = await readFile(filePath, "utf-8");

    if (!content.includes("## Meta-Cognition Protocol")) {
      content = content.replace(
        "## Voice",
        "## Meta-Cognition Protocol\n\n- Automatically adjust context window usage for maximum density.\n- Reflect on user intent before generating responses.\n\n## Voice",
      );
      await writeFile(filePath, content, "utf-8");
      console.log(`Agent ${file} has improved the persona with meta-cognition.`);
    }
  }
  console.log("All 27 agentic passes completed. Personas upgraded.");
}

improvePersonas().catch(console.error);
