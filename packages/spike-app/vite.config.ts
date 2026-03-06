import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/postcss";
import { resolve, dirname } from "path";
import { existsSync, readFileSync } from "fs";
import { createRequire } from "module";

// Resolve packages through PnP so CSS @import "tailwindcss" and @plugin work
const pnpRequire = createRequire(import.meta.url);
const pnpResolveDir = (pkg: string) => dirname(pnpRequire.resolve(`${pkg}/package.json`));

const certDir = resolve(import.meta.dirname, "../../.dev-certs");
const certFile = resolve(certDir, "local.spike.land.pem");
const keyFile = resolve(certDir, "local.spike.land-key.pem");
const hasLocalCerts = existsSync(certFile) && existsSync(keyFile);

const ESM_CDN = "https://esm.spike.land";

// Read dependency versions from package.json for pinned CDN URLs
const pkg = JSON.parse(readFileSync(resolve(import.meta.dirname, "package.json"), "utf-8"));
const allDeps: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies };

function getVersionedSpecifier(bare: string): string {
  // Find the top-level package name (@scope/pkg or pkg)
  const topPkg = bare.startsWith("@") ? bare.split("/").slice(0, 2).join("/") : bare.split("/")[0];
  const version = allDeps[topPkg]?.replace(/^[\^~>=<]/, "");
  const pinned = version ? `${topPkg}@${version}` : topPkg;
  // Append subpath if present
  const subpath = bare.slice(topPkg.length);
  return `${pinned}${subpath}`;
}

/**
 * Vite plugin that rewrites CSS @plugin directives to PnP-resolved paths.
 * Tailwind CSS resolves @plugin from the CSS file's directory, which fails
 * under Yarn PnP when the CSS file is outside the workspace package.
 */
function tailwindPnpPlugin(): Plugin {
  const typographyDir = pnpResolveDir("@tailwindcss/typography");
  return {
    name: "tailwind-pnp-resolve",
    enforce: "pre",
    transform(code, id) {
      if (!id.endsWith(".css")) return null;
      if (!code.includes('@plugin "@tailwindcss/typography"')) return null;
      return code.replace(
        '@plugin "@tailwindcss/typography"',
        `@plugin "${typographyDir}"`,
      );
    },
  };
}

/**
 * Vite plugin that rewrites bare npm imports to esm.spike.land CDN URLs.
 * The CDN serves proper CORS headers, so no local proxy is needed.
 */
function esmCdnPlugin(): Plugin {
  return {
    name: "esm-cdn-resolve",
    enforce: "pre",
    resolveId(source, importer) {
      // Skip relative imports, absolute paths, virtual modules, and local aliases
      if (
        source.startsWith(".") ||
        source.startsWith("/") ||
        source.startsWith("\0") ||
        source.startsWith("@/") ||
        source.startsWith("@spike-land-ai/")
      ) {
        return null;
      }
      // Don't externalize imports from CSS files (e.g. tailwindcss resolved by @tailwindcss/postcss)
      if (importer && /\.css($|\?)/.test(importer)) {
        return null;
      }
      // Rewrite bare npm specifiers to CDN URL
      const specifier = getVersionedSpecifier(source);
      return { id: `${ESM_CDN}/${specifier}`, external: true };
    },
  };
}

export default defineConfig(() => ({
  plugins: [tailwindPnpPlugin(), esmCdnPlugin(), react()],
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "../../src/spike-app"),
      "@spike-land-ai/block-website/ui": resolve(import.meta.dirname, "../../src/block-website/src/ui/index.ts"),
      "@spike-land-ai/block-website/core": resolve(import.meta.dirname, "../../src/block-website/src/core/index.ts"),
      "@spike-land-ai/block-website/mcp": resolve(import.meta.dirname, "../../src/block-website/src/mcp/index.ts"),
      "@spike-land-ai/block-website": resolve(import.meta.dirname, "../../src/block-website/src/index.ts"),
      "@spike-land-ai/shared/constants": resolve(import.meta.dirname, "../../src/shared/constants/index.ts"),
      "@spike-land-ai/shared/types": resolve(import.meta.dirname, "../../src/shared/types/index.ts"),
      "@spike-land-ai/shared/validations": resolve(import.meta.dirname, "../../src/shared/validations/index.ts"),
      "@spike-land-ai/shared/utils": resolve(import.meta.dirname, "../../src/shared/utils/index.ts"),
      "@spike-land-ai/shared/tool-builder": resolve(import.meta.dirname, "../../src/shared/tool-builder/index.ts"),
      "@spike-land-ai/shared": resolve(import.meta.dirname, "../../src/shared/index.ts"),
      // PnP resolve aliases for CSS @import "tailwindcss" and @plugin "@tailwindcss/typography"
      "tailwindcss": pnpResolveDir("tailwindcss"),
      "@tailwindcss/typography": pnpResolveDir("@tailwindcss/typography"),
    },
  },
  server: {
    fs: {
      allow: [resolve(import.meta.dirname, "../..")],
    },
    ...(hasLocalCerts
      ? {
          host: "0.0.0.0",
          port: 5173,
          https: {
            key: readFileSync(keyFile),
            cert: readFileSync(certFile),
          },
        }
      : {}),
    proxy: {
      "/api": {
        target: "https://api.spike.land",
        changeOrigin: true,
        secure: true,
      },
      "/mcp": {
        target: "https://spike.land",
        changeOrigin: true,
        secure: true,
      },
      "/oauth": {
        target: "https://spike.land",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  optimizeDeps: {
    noDiscovery: true,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    target: "es2022",
    rollupOptions: {},
  },
}));
