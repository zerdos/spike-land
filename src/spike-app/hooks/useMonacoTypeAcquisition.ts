import { useEffect, useState, useRef } from "react";
import { getTypeCache, setTypeCache } from "../lib/ata-cache";

interface UseMonacoTypeAcquisitionProps {
  monaco: typeof import("monaco-editor") | null;
  code: string;
  debounceMs?: number;
}

export function useMonacoTypeAcquisition({
  monaco,
  code,
  debounceMs = 2000,
}: UseMonacoTypeAcquisitionProps) {
  const [typesReady, setTypesReady] = useState(false);
  const ataRunnerRef = useRef<{ update: (code: string) => void } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const libsRef = useRef<Map<string, string>>(new Map());
  const initialMountRef = useRef(true);

  useEffect(() => {
    if (!monaco) return;

    let isActive = true;

    async function initializeAta() {
      try {
        const [{ setupTypeAcquisition }, ts] = await Promise.all([
          import("@typescript/ata"),
          import("typescript"),
        ]);

        if (!isActive) return;

        const ata = setupTypeAcquisition({
          projectName: "spike-app",
          typescript: ts,
          logger: console,
          delegate: {
            receivedFile: (code, path) => {
              if (libsRef.current.get(path) === code) return;
              libsRef.current.set(path, code);
            },
            started: () => {
              // Reset readiness to provide loading feedback if necessary
            },
            progress: (_downloaded, _total) => {
              // Optional progress feedback
            },
            finished: (libs) => {
              if (!isActive) return;

              // Ensure we load new definitions
              monaco!.languages.typescript.typescriptDefaults.setExtraLibs(
                Array.from(libs.entries()).map(([filePath, content]) => ({
                  filePath,
                  content,
                })),
              );

              setTypesReady(true);
            },
          },
          fetcher: async (request: RequestInfo | URL, init?: RequestInit) => {
            const url = typeof request === "string" ? request : request.toString();
            try {
              const cached = await getTypeCache(url);
              if (cached) {
                return new Response(cached, {
                  headers: { "Content-Type": "application/javascript" },
                });
              }
              const res = await fetch(request, init);
              if (res.ok) {
                const text = await res.clone().text();
                await setTypeCache(url, text);
              }
              return res;
            } catch (err) {
              console.error("[ATA Fetch Error]", err);
              throw err;
            }
          },
        });

        ataRunnerRef.current = {
          update: (currentCode: string) => {
            // Append implicit imports for JSX support
            const codeWithImplicit = `
              import React from "react";
              import ReactDOM from "react-dom";
              import { jsx, jsxs, Fragment } from "react/jsx-runtime";
              ${currentCode}
            `;
            ata(codeWithImplicit);
          },
        };

        // Trigger initial update
        if (initialMountRef.current && code) {
          ataRunnerRef.current.update(code);
          initialMountRef.current = false;
        }
      } catch (err) {
        console.error("Failed to initialize ATA:", err);
      }
    }

    initializeAta();

    return () => {
      isActive = false;
    };
  }, [monaco]); // We intentionally do not include `code` here to avoid re-initializing ATA

  useEffect(() => {
    if (!ataRunnerRef.current) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      ataRunnerRef.current?.update(code);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [code, debounceMs]);

  return { typesReady };
}
