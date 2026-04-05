/**
 * Vibe Code route — Monaco editor with HMR live preview.
 *
 * Renders the full-screen LivePreview component as the primary UI.
 * Auto-saves work to localStorage under the "spike-vibe-editor" key.
 *
 * Route: /vibe-code  (registered in router.ts via withSuspense)
 */

import { LivePreview } from "../components/editor/LivePreview";
import type { EditorFile } from "../components/editor/LivePreview";

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export function VibeCodePage() {
  const handleDeploy = (files: EditorFile[]) => {
    // TODO: wire to the spike-edge deploy endpoint
    console.info(
      "[Vibe Code] Deploy requested",
      files.map((f) => f.name),
    );
  };

  return (
    <main
      aria-label="Vibe Code editor"
      className="flex h-[calc(100vh-var(--header-height,0px))] flex-col overflow-hidden"
      style={{ background: "hsl(var(--background))" }}
    >
      {/* Slim status bar above the editor */}
      <div
        className="flex shrink-0 items-center justify-between border-b px-4 py-1.5"
        style={{
          borderColor: "color-mix(in srgb, hsl(var(--border)) 60%, transparent)",
          background:
            "linear-gradient(90deg, color-mix(in srgb, hsl(var(--card)) 95%, transparent), color-mix(in srgb, hsl(var(--muted)) 80%, transparent))",
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.24em]"
            style={{
              background: "color-mix(in srgb, hsl(var(--primary)) 12%, transparent)",
              color: "hsl(var(--primary))",
            }}
          >
            vibe-code
          </span>
          <span className="hidden text-[11px] font-semibold text-muted-foreground sm:inline">
            spike.land editor
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "color-mix(in srgb, hsl(var(--primary)) 80%, transparent)" }}
              aria-hidden="true"
            />
            auto-save on
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">spike-vibe-editor</span>
        </div>
      </div>

      <LivePreview
        storageKey="spike-vibe-editor"
        onDeploy={handleDeploy}
        className="min-h-0 flex-1 rounded-none border-0"
      />
    </main>
  );
}
