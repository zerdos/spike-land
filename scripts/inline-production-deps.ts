import fs from "node:fs";
import path from "node:path";

function inlineDependencies() {
  const rootDir = process.cwd();
  const packageJsonPath = path.join(rootDir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

  const deps = pkg.dependencies || {};
  const vendorDir = path.join(rootDir, "vendor");

  if (!fs.existsSync(vendorDir)) {
    fs.mkdirSync(vendorDir);
  }

  // Ensure vendor/* is in workspaces
  if (!pkg.workspaces.includes("vendor/*")) {
    pkg.workspaces.push("vendor/*");
  }

  for (const [depName, version] of Object.entries(deps)) {
    if (version === "workspace:*" || version.startsWith("file:")) continue;

    console.log(`Inlining ${depName}...`);
    try {
      const depSourceDir = path.join(rootDir, "node_modules", depName);
      if (!fs.existsSync(depSourceDir)) {
        throw new Error(`Directory not found: ${depSourceDir}`);
      }
      const depTargetDir = path.join(vendorDir, depName);

      if (!fs.existsSync(depTargetDir)) {
        fs.cpSync(depSourceDir, depTargetDir, { recursive: true });
        console.log(`  Copied ${depName} to ${depTargetDir}`);
      } else {
        console.log(`  ${depName} already exists in vendor directory.`);
      }

      // Update version to use local workspace
      pkg.dependencies[depName] = "workspace:*";
    } catch (err) {
      console.error(`  Failed to resolve or copy ${depName}: ${err.message}`);
    }
  }

  // Write updated package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log("\nRoot package.json updated. Run `yarn install` to apply changes.");
}

inlineDependencies();
