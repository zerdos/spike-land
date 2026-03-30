/**
 * Extended tests for adapter-puppeteer.ts — covers branches missed by
 * adapter-puppeteer.test.ts:
 *   - PuppeteerPageWrapper.clear() — finds element and clears value
 *   - PuppeteerPageWrapper.selectOption() — delegates to el.select()
 *   - PuppeteerPageWrapper.getByRole() without name (attribute selector)
 *   - PuppeteerPageWrapper.setViewportSize() delegates to page.setViewport()
 *   - PuppeteerPageWrapper.evaluate() delegates correctly
 *   - PuppeteerAdapter.launch() is idempotent when browser already connected
 *   - PuppeteerAdapter.close() is safe to call when no browser is open
 *   - buildAriaSelector with RegExp name
 *   - PuppeteerPageWrapper.getAccessibilityTree() returns null on empty nodes
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

// ── Puppeteer mock setup ─────────────────────────────────────────────────────

const mockPageGoto = vi.fn().mockResolvedValue(null);
const mockPageTitle = vi.fn().mockResolvedValue("Test Page");
const mockPageUrl = vi.fn().mockReturnValue("https://example.com");
const mockPageClose = vi.fn().mockResolvedValue(undefined);
const mockPageIsClosed = vi.fn().mockReturnValue(false);
const mockPageScreenshot = vi.fn().mockResolvedValue("base64png");
const mockPageEvaluate = vi.fn().mockResolvedValue("eval-result");
const mockPageSetViewport = vi.fn().mockResolvedValue(undefined);
const mockPageViewport = vi.fn().mockReturnValue({ width: 1280, height: 720 });
const mockKeyboardPress = vi.fn().mockResolvedValue(undefined);
const mockKeyboardType = vi.fn().mockResolvedValue(undefined);
const mockMouseWheel = vi.fn().mockResolvedValue(undefined);
const mockPageQuery = vi.fn();
const mockCdpSend = vi.fn().mockResolvedValue({ nodes: [] });
const mockCreateCDPSession = vi.fn().mockResolvedValue({ send: mockCdpSend });

function makeMockPuppeteerPage() {
  return {
    goto: mockPageGoto,
    title: mockPageTitle,
    url: mockPageUrl,
    close: mockPageClose,
    isClosed: mockPageIsClosed,
    screenshot: mockPageScreenshot,
    evaluate: mockPageEvaluate,
    setViewport: mockPageSetViewport,
    viewport: mockPageViewport,
    keyboard: { press: mockKeyboardPress, type: mockKeyboardType },
    mouse: { wheel: mockMouseWheel },
    $: mockPageQuery,
    $$: vi.fn().mockResolvedValue([]),
    createCDPSession: mockCreateCDPSession,
  };
}

const mockBrowserNewPage = vi.fn();
const mockBrowserClose = vi.fn().mockResolvedValue(undefined);
const mockBrowserIsConnected = vi.fn().mockReturnValue(true);

vi.mock("@cloudflare/puppeteer", () => ({
  default: {
    launch: vi.fn().mockResolvedValue({
      newPage: mockBrowserNewPage,
      close: mockBrowserClose,
      isConnected: mockBrowserIsConnected,
    }),
  },
}));

import { PuppeteerAdapter } from "../../src/core/browser-automation/edge/adapter-puppeteer.js";

const mockBinding = {} as Fetcher;

describe("PuppeteerPageWrapper — clear()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBrowserNewPage.mockResolvedValue(makeMockPuppeteerPage());
    mockBrowserIsConnected.mockReturnValue(true);
  });

  it("clear() finds element by aria selector and clears value", async () => {
    const mockEl = {
      evaluate: vi.fn().mockResolvedValue(undefined),
    };
    mockPageQuery.mockResolvedValue(mockEl);

    const adapter = new PuppeteerAdapter(mockBinding);
    const page = await adapter.newPage();
    await page.getByRole("textbox", { name: "Username" }).clear();

    expect(mockPageQuery).toHaveBeenCalledWith('aria/Username[role="textbox"]');
    expect(mockEl.evaluate).toHaveBeenCalled();
  });

  it("clear() throws when element is not found", async () => {
    mockPageQuery.mockResolvedValue(null);

    const adapter = new PuppeteerAdapter(mockBinding);
    const page = await adapter.newPage();
    await expect(page.getByRole("textbox", { name: "Ghost" }).clear()).rejects.toThrow(
      "No element found",
    );
  });
});

describe("PuppeteerPageWrapper — selectOption()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBrowserNewPage.mockResolvedValue(makeMockPuppeteerPage());
    mockBrowserIsConnected.mockReturnValue(true);
  });

  it("selectOption() delegates to el.select()", async () => {
    const mockEl = {
      select: vi.fn().mockResolvedValue(["US"]),
    };
    mockPageQuery.mockResolvedValue(mockEl);

    const adapter = new PuppeteerAdapter(mockBinding);
    const page = await adapter.newPage();
    const result = await page.getByRole("combobox", { name: "Country" }).selectOption("US");

    expect(mockPageQuery).toHaveBeenCalledWith('aria/Country[role="combobox"]');
    expect(mockEl.select).toHaveBeenCalledWith("US");
    expect(result).toEqual(["US"]);
  });

  it("selectOption() throws when element is not found", async () => {
    mockPageQuery.mockResolvedValue(null);

    const adapter = new PuppeteerAdapter(mockBinding);
    const page = await adapter.newPage();
    await expect(page.getByRole("combobox", { name: "Missing" }).selectOption("X")).rejects.toThrow(
      "No element found",
    );
  });
});

describe("PuppeteerPageWrapper — getByRole() without name", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBrowserNewPage.mockResolvedValue(makeMockPuppeteerPage());
    mockBrowserIsConnected.mockReturnValue(true);
  });

  it("uses attribute selector [role=...] when no name provided", async () => {
    const mockEl = { click: vi.fn().mockResolvedValue(undefined) };
    mockPageQuery.mockResolvedValue(mockEl);

    const adapter = new PuppeteerAdapter(mockBinding);
    const page = await adapter.newPage();
    await page.getByRole("button").click();

    expect(mockPageQuery).toHaveBeenCalledWith('[role="button"]');
  });
});

describe("PuppeteerPageWrapper — getByRole() with RegExp name", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBrowserNewPage.mockResolvedValue(makeMockPuppeteerPage());
    mockBrowserIsConnected.mockReturnValue(true);
  });

  it("uses RegExp source string in aria selector", async () => {
    const mockEl = { click: vi.fn().mockResolvedValue(undefined) };
    mockPageQuery.mockResolvedValue(mockEl);

    const adapter = new PuppeteerAdapter(mockBinding);
    const page = await adapter.newPage();
    await page.getByRole("button", { name: /Submit/ }).click();

    // Should use the regex source ("Submit") in the selector
    expect(mockPageQuery).toHaveBeenCalledWith('aria/Submit[role="button"]');
  });
});

describe("PuppeteerPageWrapper — setViewportSize()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBrowserNewPage.mockResolvedValue(makeMockPuppeteerPage());
    mockBrowserIsConnected.mockReturnValue(true);
  });

  it("delegates to puppeteer page.setViewport()", async () => {
    const adapter = new PuppeteerAdapter(mockBinding);
    const page = await adapter.newPage();
    await page.setViewportSize({ width: 375, height: 812 });

    expect(mockPageSetViewport).toHaveBeenCalledWith({ width: 375, height: 812 });
  });
});

describe("PuppeteerPageWrapper — evaluate()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBrowserNewPage.mockResolvedValue(makeMockPuppeteerPage());
    mockBrowserIsConnected.mockReturnValue(true);
  });

  it("delegates string expression to puppeteer evaluate()", async () => {
    const adapter = new PuppeteerAdapter(mockBinding);
    const page = await adapter.newPage();
    const result = await page.evaluate("document.title");

    expect(mockPageEvaluate).toHaveBeenCalledWith("document.title");
    expect(result).toBe("eval-result");
  });
});

describe("PuppeteerAdapter — launch idempotency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBrowserNewPage.mockResolvedValue(makeMockPuppeteerPage());
    mockBrowserIsConnected.mockReturnValue(true);
  });

  it("does not re-launch when browser is already connected", async () => {
    const adapter = new PuppeteerAdapter(mockBinding);
    await adapter.launch(); // first launch
    await adapter.launch(); // should be a no-op

    // @cloudflare/puppeteer.default.launch should only be called once
    const { default: puppeteer } = await import("@cloudflare/puppeteer" as string);
    expect(puppeteer.launch).toHaveBeenCalledTimes(1);
  });
});

describe("PuppeteerAdapter — close() when no browser open", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBrowserIsConnected.mockReturnValue(false);
  });

  it("does not throw when close() is called before any launch", async () => {
    const adapter = new PuppeteerAdapter(mockBinding);
    await expect(adapter.close()).resolves.toBeUndefined();
    expect(mockBrowserClose).not.toHaveBeenCalled();
  });
});

describe("PuppeteerPageWrapper — getAccessibilityTree() with no nodes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBrowserNewPage.mockResolvedValue(makeMockPuppeteerPage());
    mockBrowserIsConnected.mockReturnValue(true);
  });

  it("returns null when CDP returns no nodes array", async () => {
    mockCdpSend.mockResolvedValue({});

    const adapter = new PuppeteerAdapter(mockBinding);
    const page = await adapter.newPage();
    const tree = await page.getAccessibilityTree();

    expect(tree).toBeNull();
  });
});
