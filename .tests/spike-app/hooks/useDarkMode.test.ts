import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useDarkMode } from "@/ui/hooks/useDarkMode";

describe("useDarkMode", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.className = "";
  });

  it("syncs theme changes across hook instances", async () => {
    const first = renderHook(() => useDarkMode());
    const second = renderHook(() => useDarkMode());

    expect(first.result.current.theme).toBe("light");
    expect(second.result.current.theme).toBe("light");

    act(() => {
      first.result.current.setTheme("dark");
    });

    await waitFor(() => {
      expect(second.result.current.theme).toBe("dark");
    });

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(false);
    expect(window.localStorage.getItem("theme-preference")).toBe("dark");

    act(() => {
      second.result.current.toggleTheme();
    });

    await waitFor(() => {
      expect(first.result.current.theme).toBe("light");
    });

    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(window.localStorage.getItem("theme-preference")).toBe("light");
  });

  it("updates when the theme preference changes outside the current hook", async () => {
    const { result } = renderHook(() => useDarkMode());

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "theme-preference",
          newValue: "dark",
        }),
      );
    });

    await waitFor(() => {
      expect(result.current.theme).toBe("dark");
    });
  });
});
