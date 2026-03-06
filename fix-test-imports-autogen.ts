
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const mappingPath = path.join(root, 'src/.mapping.json');
if (!fs.existsSync(mappingPath)) {
    console.error('Mapping file not found at', mappingPath);
    process.exit(1);
}
const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

// Reversed packagePathMap from .tests/vitest.config.ts
const packagePathMap = {
  "mcp-tools/bazdmeg": "bazdmeg-mcp",
  "core/block-sdk": "block-sdk",
  "core/block-tasks": "block-tasks",
  "core/block-website": "block-website",
  "core/chess": "chess-engine",
  "frontend/monaco-editor": "code",
  "utilities/esm-cdn": "esm-cdn",
  "mcp-tools/esbuild-wasm": "esbuild-wasm-mcp",
  "mcp-tools/google-analytics": "google-analytics-mcp",
  "mcp-tools/google-ads": "google-ads-mcp",
  "mcp-tools/hackernews": "hackernews-mcp",
  "edge-api/image-studio-worker": "image-studio-worker",
  "utilities/incremental-test": "incremental-test-mcp",
  "edge-api/auth": "mcp-auth",
  "mcp-tools/image-studio": "mcp-image-studio",
  "core/server-base": "mcp-server-base",
  "mcp-tools/openclaw": "openclaw-mcp",
  "core/browser-automation": "qa-studio",
  "core/react-engine": "react-ts-worker",
  "core/shared-utils": "shared",
  "frontend/platform-frontend": "spike-app",
  "cli/spike-cli": "spike-cli",
  "edge-api/main": "spike-edge",
  "edge-api/backend": "spike-land-backend",
  "edge-api/spike-land": "spike-land-mcp",
  "mcp-tools/code-review": "spike-review",
  "mcp-tools/stripe-analytics": "stripe-analytics-mcp",
  "core/statecharts": "state-machine",
  "edge-api/transpile": "transpile",
  "cli/docker-dev": "vibe-dev",
  "media/educational-videos": "video",
  "utilities/whatsapp": "whatsapp-mcp",
};

const sortedPackagePaths = Object.keys(packagePathMap).sort((a, b) => b.length - a.length);

function resolveNewPath(importPath) {
  const srcPrefix = "../../src/";
  if (!importPath.startsWith(srcPrefix)) return null;

  let relPath = importPath.substring(srcPrefix.length);
  
  let pkgOld = null;
  let pkgPath = null;
  for (const p of sortedPackagePaths) {
    if (relPath.startsWith(p + '/') || relPath === p) {
      pkgPath = p;
      pkgOld = packagePathMap[p];
      break;
    }
  }

  if (!pkgOld) return null;

  let remaining = relPath.substring(pkgPath.length);
  if (remaining.startsWith('/')) remaining = remaining.substring(1);

  const ext = path.extname(remaining);
  const base = remaining.substring(0, remaining.length - (ext ? ext.length : 0));
  
  const srcOldBase = `src-old/${pkgOld}/${base || 'index'}`;
  let newPathInMapping = mapping[srcOldBase + '.ts'] || mapping[srcOldBase + '.tsx'] || mapping[srcOldBase + '.js'] || mapping[srcOldBase];

  if (newPathInMapping) {
    let targetExt = ext || '.js';
    const newExt = path.extname(newPathInMapping);
    const newBase = newPathInMapping.substring(0, newPathInMapping.length - (newExt ? newExt.length : 0));
    
    let finalPath = newBase + targetExt;
    if (finalPath === relPath) return null;
    return srcPrefix + finalPath;
  }

  return null;
}

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.test.ts') || file.endsWith('.test.tsx') || file.endsWith('.spec.ts') || file.endsWith('.spec.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const testFiles = walk(path.join(root, '.tests'));

for (const file of testFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  const importRegex = /(from\s+['"])(\.\.\/\.\.\/src\/[^'"]+)(['"])/g;

  content = content.replace(importRegex, (match, prefix, importPath, suffix) => {
    const resolved = resolveNewPath(importPath);
    if (resolved) {
      changed = true;
      return prefix + resolved + suffix;
    }
    return match;
  });

  if (changed) {
    console.log(`Updating ${file}...`);
    fs.writeFileSync(file, content, 'utf8');
  }
}

console.log('Done.');
