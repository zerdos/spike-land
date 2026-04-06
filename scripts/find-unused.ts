import { Project, SourceFile } from "ts-morph";
import path from "node:path";
import fs from "node:fs/promises";

async function main() {
  const project = new Project({
    tsConfigFilePath: path.resolve(process.cwd(), "tsconfig.json"),
    skipAddingFilesFromTsConfig: true,
  });

  const srcDir = path.resolve(process.cwd(), "src");
  const packagesDir = path.resolve(process.cwd(), "packages");

  project.addSourceFilesAtPaths([`${srcDir}/**/*.{ts,tsx}`, `${packagesDir}/**/*.{ts,tsx,astro}`]);

  const allFiles = project.getSourceFiles();

  const entryPoints = new Set([
    "index.ts",
    "index.tsx",
    "main.ts",
    "main.tsx",
    "cli.ts",
    "+page.server.ts",
    "+page.ts",
  ]);

  const isEntry = (f: SourceFile) => {
    const base = path.basename(f.getFilePath());
    if (entryPoints.has(base)) return true;
    if (base.includes("config.ts")) return true;
    if (f.getFilePath().includes("/pages/")) return true;
    if (f.getFilePath().includes("routes/")) return true;
    if (f.getFilePath().endsWith(".astro")) return true;
    if (f.getFilePath().endsWith(".d.ts")) return true;
    return false;
  };

  const unusedFiles: string[] = [];

  for (const file of allFiles) {
    if (file.getFilePath().includes("node_modules")) continue;
    if (isEntry(file)) continue;

    const references = file.getReferencingSourceFiles();
    if (references.length === 0) {
      unusedFiles.push(file.getFilePath());
    }
  }

  console.log(`Found ${unusedFiles.length} potentially unused files:`);
  unusedFiles.forEach((f) => console.log(f.replace(process.cwd() + "/", "")));
}

main().catch(console.error);
