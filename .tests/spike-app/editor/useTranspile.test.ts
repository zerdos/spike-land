import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useTranspile, buildPreviewHtml } from "@/ui/components/editor/useTranspile";

// ---------------------------------------------------------------------------
// Mock fetch
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  mockFetch.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// buildPreviewHtml unit tests
// ---------------------------------------------------------------------------

describe("buildPreviewHtml", () => {
  it("includes the transpiled code in the output", () => {
    const html = buildPreviewHtml("const x = 1;", false);
    expect(html).toContain("const x = 1;");
  });

  it("sets dark theme class when isDarkMode is true", () => {
    const html = buildPreviewHtml("", true);
    expect(html).toContain('data-theme="dark"');
  });

  it("sets light theme class when isDarkMode is false", () => {
    const html = buildPreviewHtml("", false);
    expect(html).toContain('data-theme="light"');
  });

  it("strips export default function and keeps function name", () => {
    const html = buildPreviewHtml("export default function MyComp() {}", false);
    expect(html).toContain("function MyComp()");
    expect(html).not.toContain("export default function");
  });

  it("replaces anonymous export default with const App", () => {
    const html = buildPreviewHtml("export default () => <div/>", false);
    expect(html).toContain("const App =");
  });

  it("includes correct React version 19.2.4 in import map", () => {
    const html = buildPreviewHtml("const x = 1;", false);
    expect(html).toContain("react@19.2.4");
    expect(html).not.toContain("react@19.0.0");
  });

  it("includes Tailwind v4 @theme inline config", () => {
    const html = buildPreviewHtml("const x = 1;", false);
    expect(html).toContain("@theme inline");
    expect(html).toContain("--color-background");
    expect(html).toContain("--color-foreground");
    expect(html).toContain("--color-primary");
  });

  it("includes Tailwind browser v4 CDN script", () => {
    const html = buildPreviewHtml("const x = 1;", false);
    expect(html).toContain("@tailwindcss/browser@4");
  });

  it("includes Rubik font in font-sans CSS", () => {
    const html = buildPreviewHtml("const x = 1;", false);
    expect(html).toContain("Rubik");
  });

  it("includes esm.sh import map entries for React and Emotion", () => {
    const html = buildPreviewHtml("const x = 1;", false);
    expect(html).toContain("esm.sh/react@");
    expect(html).toContain("esm.sh/react-dom@");
    expect(html).toContain("esm.sh/@emotion/react@");
    expect(html).toContain("esm.sh/@emotion/styled@");
  });

  it("includes error display div for runtime errors", () => {
    const html = buildPreviewHtml("const x = 1;", false);
    expect(html).toContain('id="error-display"');
  });

  it("includes process polyfill for Node compatibility", () => {
    const html = buildPreviewHtml("const x = 1;", false);
    expect(html).toContain("globalThis.process");
    expect(html).toContain("NODE_ENV");
  });

  it("uses different background colors for dark vs light mode", () => {
    const light = buildPreviewHtml("const x = 1;", false);
    const dark = buildPreviewHtml("const x = 1;", true);
    // Dark mode uses #0a0c14, light uses #f9fafb
    expect(dark).toContain("#0a0c14");
    expect(light).toContain("#f9fafb");
  });

  it("strips export { } statements", () => {
    const html = buildPreviewHtml(
      "function helper() {}\nexport { helper };\nexport default function App() { return null; }",
      false,
    );
    expect(html).not.toContain("export {");
  });

  it("handles named default class export", () => {
    const html = buildPreviewHtml("export default class Widget {}", false);
    expect(html).toContain("class Widget");
    expect(html).not.toContain("export default class");
  });

  it("handles export default identifier", () => {
    const html = buildPreviewHtml("const Foo = () => null;\nexport default Foo;", false);
    expect(html).not.toContain("export default Foo;");
  });
});

// ---------------------------------------------------------------------------
// useTranspile hook tests
// ---------------------------------------------------------------------------

describe("useTranspile", () => {
  it("starts with no output and isTranspiling=false", () => {
    const { result } = renderHook(() => useTranspile("", { debounceMs: 100 }));
    expect(result.current.html).toBeNull();
    expect(result.current.isTranspiling).toBe(false);
  });

  it("sets isTranspiling=true while debouncing non-empty source", async () => {
    mockFetch.mockResolvedValue({ ok: true, text: () => Promise.resolve("const x=1;") });
    const { result } = renderHook(() => useTranspile("const a = 1;", { debounceMs: 200 }));

    // After first render, transpiling should be true because timeout hasn't fired
    expect(result.current.isTranspiling).toBe(true);
  });

  it("produces html after debounce fires and fetch resolves", async () => {
    mockFetch.mockResolvedValue({ ok: true, text: () => Promise.resolve("const x=1;") });
    const { result } = renderHook(() => useTranspile("const a=1;", { debounceMs: 100 }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });

    await waitFor(() => {
      expect(result.current.html).not.toBeNull();
    });

    expect(result.current.isTranspiling).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets error when fetch fails", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      text: () => Promise.resolve("SyntaxError: unexpected token"),
    });
    const { result } = renderHook(() => useTranspile("const;", { debounceMs: 100 }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.html).toBeNull();
  });

  it("clearError resets the error state", async () => {
    mockFetch.mockResolvedValue({ ok: false, text: () => Promise.resolve("bad code") });
    const { result } = renderHook(() => useTranspile("x;", { debounceMs: 100 }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });
    await waitFor(() => expect(result.current.error).not.toBeNull());

    act(() => {
      result.current.clearError();
    });
    expect(result.current.error).toBeNull();
  });

  it("resets state when source becomes empty", () => {
    const { result, rerender } = renderHook(
      ({ src }: { src: string }) => useTranspile(src, { debounceMs: 100 }),
      { initialProps: { src: "const x=1;" } },
    );

    rerender({ src: "" });
    expect(result.current.html).toBeNull();
    expect(result.current.isTranspiling).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("reports error when fetch network fails entirely", async () => {
    mockFetch.mockRejectedValue(new Error("network failure"));

    // Use unique source to avoid transpileCache hits
    const { result } = renderHook(() =>
      useTranspile("const uniqueForFallbackTest = Date.now();", { debounceMs: 100 }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.error?.message).toContain("network failure");
  });

  it("re-renders HTML on theme toggle without re-transpiling", async () => {
    mockFetch.mockResolvedValue({ ok: true, text: () => Promise.resolve("const x=1;") });

    const { result, rerender } = renderHook(
      ({ dark }: { dark: boolean }) =>
        useTranspile("const x=1;", { debounceMs: 100, isDarkMode: dark }),
      { initialProps: { dark: false } },
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });

    await waitFor(() => {
      expect(result.current.html).not.toBeNull();
    });

    expect(result.current.html).toContain('data-theme="light"');
    const callsBefore = mockFetch.mock.calls.length;

    rerender({ dark: true });

    await waitFor(() => {
      expect(result.current.html).toContain('data-theme="dark"');
    });

    // No additional fetch call for theme change
    expect(mockFetch.mock.calls.length).toBe(callsBefore);
  });
});
