import type { FileNode } from "./types.js";

export function checkLint(nodes: FileNode[], packageCategories: Map<string, string>) {
  let violations = 0;
  for (const n of nodes) {
    const category = packageCategories.get(n.packageName);
    if (category === "core") {
      const hasFrontend = [...n.externalDeps].some((d) => d === "react" || d === "react-dom");
      if (hasFrontend) {
        console.warn(
          `Lint violation: 'core' package '${n.packageName}' file '${n.relPath}' imports frontend dependencies.`,
        );
        violations++;
      }
    }
  }
  return violations;
}
