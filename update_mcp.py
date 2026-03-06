import os
import re

def replace_in_file(filepath, pattern, replacement):
    with open(filepath, "r") as f:
        content = f.read()
    content = content.replace(pattern, replacement)
    with open(filepath, "w") as f:
        f.write(content)

# 1. wrangler.toml
with open("packages/spike-land-mcp/wrangler.toml", "r") as f:
    wrangler_content = f.read()
if "SPA_ASSETS" not in wrangler_content:
    wrangler_content = wrangler_content.replace(
        "[[services]]",
        "[[r2_buckets]]\nbinding = \"SPA_ASSETS\"\nbucket_name = \"spike-app-assets\"\n\n[[services]]"
    )
    with open("packages/spike-land-mcp/wrangler.toml", "w") as f:
        f.write(wrangler_content)

# 2. src/spike-land-mcp/env.ts
replace_in_file(
    "src/spike-land-mcp/env.ts",
    "  KV: KVNamespace;",
    "  KV: KVNamespace;\n  SPA_ASSETS: R2Bucket;"
)

# 3. src/spike-land-mcp/mcp/manifest.ts
replace_in_file(
    "src/spike-land-mcp/mcp/manifest.ts",
    "  spikeEdge?: Fetcher | undefined;\n}",
    "  spikeEdge?: Fetcher | undefined;\n  spaAssets?: R2Bucket | undefined;\n}"
)
replace_in_file(
    "src/spike-land-mcp/mcp/manifest.ts",
    "safeRegister(registerStorageTools, \"registerStorageTools\", registry, userId, db);",
    "safeRegister(registerStorageTools, \"registerStorageTools\", registry, userId, db, env?.spaAssets);"
)

# 4. src/spike-land-mcp/mcp/server.ts
replace_in_file(
    "src/spike-land-mcp/mcp/server.ts",
    "  vaultSecret?: string;\n}",
    "  vaultSecret?: string;\n  mcpInternalSecret?: string;\n  spikeEdge?: Fetcher;\n  spaAssets?: R2Bucket;\n}"
)
replace_in_file(
    "src/spike-land-mcp/mcp/server.ts",
    "    ...(options?.vaultSecret !== undefined ? { vaultSecret: options.vaultSecret } : {}),\n  });",
    "    ...(options?.vaultSecret !== undefined ? { vaultSecret: options.vaultSecret } : {}),\n    ...(options?.mcpInternalSecret !== undefined ? { mcpInternalSecret: options.mcpInternalSecret } : {}),\n    ...(options?.spikeEdge !== undefined ? { spikeEdge: options.spikeEdge } : {}),\n    ...(options?.spaAssets !== undefined ? { spaAssets: options.spaAssets } : {}),\n  });"
)

# 5. src/spike-land-mcp/routes/mcp.ts
replace_in_file(
    "src/spike-land-mcp/routes/mcp.ts",
    "    kv: c.env.KV,\n    vaultSecret: c.env.VAULT_SECRET,\n  });",
    "    kv: c.env.KV,\n    vaultSecret: c.env.VAULT_SECRET,\n    mcpInternalSecret: c.env.MCP_INTERNAL_SECRET,\n    spikeEdge: c.env.SPIKE_EDGE,\n    spaAssets: c.env.SPA_ASSETS,\n  });"
)

print("Updates applied.")
