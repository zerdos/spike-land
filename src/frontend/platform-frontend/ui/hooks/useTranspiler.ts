import { useState, useEffect, useRef } from "react";

interface TranspileResult {
  html: string | null;
  error: string | null;
  isTranspiling: boolean;
}

/**
 * Post-process transpiled code so it can run in an inline module script.
 * - Named default exports (`export default function App`) keep the binding.
 * - Anonymous default exports get assigned to `const App`.
 * - Other `export` keywords are stripped.
 */
function prepareForPreview(transpiled: string): { code: string; appRef: string } {
  let code = transpiled;
  let appRef = "App";

  // export default function Name(
  const namedFn = code.match(/export\s+default\s+function\s+(\w+)/);
  if (namedFn) {
    appRef = namedFn[1]!;
    code = code.replace(/export\s+default\s+function\s+/, "function ");
  } else {
    // export default class Name
    const namedClass = code.match(/export\s+default\s+class\s+(\w+)/);
    if (namedClass) {
      appRef = namedClass[1]!;
      code = code.replace(/export\s+default\s+class\s+/, "class ");
    } else {
      // export default Identifier;
      const ident = code.match(/export\s+default\s+(\w+)\s*;/);
      if (ident) {
        appRef = ident[1]!;
        code = code.replace(/export\s+default\s+\w+\s*;/, "");
      } else if (/export\s+default\s+/.test(code)) {
        // Anonymous: export default () => ... or export default (props) => ...
        code = code.replace(/export\s+default\s+/, "const App = ");
        appRef = "App";
      }
    }
  }

  // Strip remaining export keywords (export const, export function, export { })
  code = code.replace(/^export\s+\{[^}]*\}\s*;?\s*$/gm, "");
  code = code.replace(/^export\s+/gm, "");

  return { code, appRef };
}

function buildPreviewHtml(transpiledCode: string): string {
  const { code, appRef } = prepareForPreview(transpiledCode);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script type="importmap">
  {
    "imports": {
      "react": "https://esm.sh/react@19",
      "react/": "https://esm.sh/react@19/",
      "react-dom": "https://esm.sh/react-dom@19",
      "react-dom/": "https://esm.sh/react-dom@19/"
    }
  }
  </script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>
  <div id="error-display" style="display:none;padding:1rem;color:#ef4444;font-family:ui-monospace,monospace;font-size:13px;white-space:pre-wrap;background:#fef2f2;border:1px solid #fecaca;margin:1rem;border-radius:8px;"></div>
  <script type="module">
  window.addEventListener("error", (e) => {
    const el = document.getElementById("error-display");
    el.style.display = "block";
    el.textContent = e.message;
  });

  ${code}

  try {
    const { createRoot } = await import("react-dom/client");
    const { createElement } = await import("react");
    const _Comp = typeof ${appRef} !== "undefined" ? ${appRef} : null;
    if (_Comp) {
      createRoot(document.getElementById("root")).render(createElement(_Comp));
    } else {
      document.getElementById("root").innerHTML =
        '<p style="padding:2rem;text-align:center;color:#64748b;">No component found. Export a default function.</p>';
    }
  } catch (err) {
    const el = document.getElementById("error-display");
    el.style.display = "block";
    el.textContent = err.message;
  }
  </script>
</body>
</html>`;
}

export function useTranspiler(source: string, debounceMs = 300): TranspileResult {
  const [result, setResult] = useState<TranspileResult>({
    html: null,
    error: null,
    isTranspiling: false,
  });
  const tsRef = useRef<typeof import("typescript") | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Load TypeScript compiler once
  useEffect(() => {
    let active = true;
    import("typescript").then((ts) => {
      if (active) tsRef.current = ts;
    });
    return () => { active = false; };
  }, []);

  // Debounced transpilation
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (!source.trim()) {
      setResult({ html: null, error: null, isTranspiling: false });
      return;
    }

    setResult((prev) => ({ ...prev, isTranspiling: true }));

    timeoutRef.current = setTimeout(() => {
      const ts = tsRef.current;
      if (!ts) {
        // TypeScript not loaded yet — retry shortly
        setResult((prev) => ({ ...prev, isTranspiling: true }));
        return;
      }

      try {
        const output = ts.transpileModule(source, {
          compilerOptions: {
            target: ts.ScriptTarget.ES2020,
            module: ts.ModuleKind.ES2020,
            jsx: ts.JsxEmit.ReactJSX,
            jsxImportSource: "react",
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
          },
          fileName: "App.tsx",
        });

        const html = buildPreviewHtml(output.outputText);
        setResult({ html, error: null, isTranspiling: false });
      } catch (err) {
        setResult({
          html: null,
          error: err instanceof Error ? err.message : String(err),
          isTranspiling: false,
        });
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [source, debounceMs]);

  return result;
}
