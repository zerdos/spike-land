/// <reference types="@testing-library/jest-dom/vitest" />

import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

// Mock scrollTo on Element prototype
if (typeof window !== "undefined") {
  window.Element.prototype.scrollTo = vi.fn();
}

afterEach(() => {
  cleanup();
});
