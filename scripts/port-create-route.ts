import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import process from "node:process";

const SRC_DIR = "src/frontend/platform-frontend/ui/components/create";
const ROUTES_DIR = "src/frontend/platform-frontend/ui/routes/create";
const DEST_DIR = "packages/spike-web/src/components/react/create";

async function copyAndPatch(src: string, dest: string, isRoute = false) {
  let content = await readFile(src, "utf-8");

  // Patch imports
  content = content.replace(/import \{ cn \} from ".*cn";/g, 'import { clsx as cn } from "clsx";');
  content = content.replace(
    /import \{ Button \} from ".*button";/g,
    'const Button = (props: any) => { const { asChild, variant, size, ...rest } = props; if (asChild) return props.children; return <button {...rest} className={cn("px-4 py-2 rounded-xl font-medium", props.className)} /> };',
  );
  content = content.replace(
    /import \{ Link.*\} from "@tanstack\/react-router";/g,
    'const Link = (props: any) => { const { to, params, ...rest } = props; let href = to; if (params?.appPath) href = href.replace("$appPath", params.appPath); return <a href={href} {...rest} /> };\nconst useParams = () => { if (typeof window === "undefined") return { appPath: "preview" }; const parts = window.location.pathname.split("/"); return { appPath: parts[parts.length - 1] }; };',
  );

  // Patch apiFetch to use global fetch
  content = content.replace(/import \{ apiFetch \} from ".*api";/g, "const apiFetch = fetch;");

  // If it's a route, patch relative paths to components
  if (isRoute) {
    content = content.replace(/\.\.\/\.\.\/components\/create\//g, "./");
  }

  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, content, "utf-8");
  console.log(`Copied & patched: ${dest}`);
}

async function main() {
  await copyAndPatch(join(SRC_DIR, "AppPreview.tsx"), join(DEST_DIR, "AppPreview.tsx"));
  await copyAndPatch(join(SRC_DIR, "PromptInput.tsx"), join(DEST_DIR, "PromptInput.tsx"));
  await copyAndPatch(join(SRC_DIR, "useGenerate.ts"), join(DEST_DIR, "useGenerate.ts"));
  await copyAndPatch(join(ROUTES_DIR, "create-index.tsx"), join(DEST_DIR, "CreateIndex.tsx"), true);
  await copyAndPatch(join(ROUTES_DIR, "$appPath.tsx"), join(DEST_DIR, "CreateAppDetail.tsx"), true);
}

main().catch(console.error);
