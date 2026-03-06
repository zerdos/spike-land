import json
import os

with open("packages/spike-land-mcp/package.json", "r") as f:
    pkg = json.load(f)

pkg["dependencies"] = pkg.get("dependencies", {})
pkg["dependencies"]["drizzle-orm"] = "workspace:*"
pkg["dependencies"]["zod"] = "workspace:*"

with open("packages/spike-land-mcp/package.json", "w") as f:
    json.dump(pkg, f, indent=2)

print("Updated package.json")
