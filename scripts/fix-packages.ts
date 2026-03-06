#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";
import { updatePackagesConfigs } from "./reorganize/execution.js";

async function main() {
  const mappingPath = path.resolve(process.cwd(), "src-old/.mapping.json"); // Wait, where is it?
  // I moved src-reorganized to src. So it's in src/.mapping.json
  const currentMappingPath = path.resolve(process.cwd(), "src/.mapping.json");
  
  const content = await fs.readFile(currentMappingPath, "utf-8");
  const reversibleMapping = JSON.parse(content);
  
  const pathMapping = new Map<string, string>();
  for (const [oldRel, newRel] of Object.entries<string>(reversibleMapping)) {
    // oldRel is relative to root
    // newRel is relative to src-reorganized (which is now src)
    const oldAbs = path.resolve(process.cwd(), oldRel);
    const newAbs = path.resolve(process.cwd(), "src", newRel);
    pathMapping.set(oldAbs, newAbs);
  }
  
  console.log("Updating packages configs...");
  await updatePackagesConfigs(pathMapping);
  console.log("Done!");
}

main().catch(console.error);
