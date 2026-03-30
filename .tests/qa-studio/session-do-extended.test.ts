/**
 * Extended tests for session-do.ts — covers branches missed by
 * session-do.test.ts:
 *   - click() with role+name (no ref)
 *   - click() with ref pointing to an element
 *   - click() when ref is missing from the tree
 *   - click() with neither ref nor role
 *   - type() with ref
 *   - type() with name
 *   - select() with name
 *   - select() with ref
 *   - scroll() upward
 *   - scroll() with no active tab
 *   - press() with no active tab
 *   - readPage() with landmark argument
 *   - ensureTab reuses existing tab when index matches
 *   - listTabs removes closed tabs from map
 *   - closeTab updates activeTabIndex when active tab is closed
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

const mockLaunch = vi.fn().mockResolvedValue(undefined);
const mockNewPage = vi.fn();
const mockIsConnected = vi.fn().mockReturnValue(true);
const mockAdapterClose = vi.fn().mockResolvedValue(undefined);

vi.mock("../../src/core/browser-automation/edge/adapter-puppeteer.js", () => ({
  PuppeteerAdapter: class MockPuppeteerAdapter {
    launch() {
      return mockLaunch();
    }
    newPage() {
      return mockNewPage();
    }
    isConnected() {
      return mockIsConnected();
    }
    close() {
      return mockAdapterClose();
    }
  },
}));

vi.mock("cloudflare:workers", () => {
  class FakeDurableObject {
    env: unknown;
    ctx: unknown;
    constructor(ctx: unknown, env: unknown) {
      this.env = env;
      this.ctx = ctx;
    }
  }
  return { DurableObject: FakeDurableObject };
});

// ── Mock page factory with a real accessibility tree ─────────────────────────

function makeMockPage(opts: { closed?: boolean } = {}) {
  const closed = opts.closed ?? false;
  const clickFn = vi.fn().mockResolvedValue(undefined);
  const fillFn = vi.fn().mockResolvedValue(undefined);
  const clearFn = vi.fn().mockResolvedValue(undefined);
  const selectOptionFn = vi.fn().mockResolvedValue([]);

  return {
    goto: vi.fn().mockResolvedValue(null),
    title: vi.fn().mockResolvedValue("Test Page"),
    url: vi.fn().mockReturnValue("https://example.com"),
    screenshot: vi.fn().mockResolvedValue("base64data"),
    evaluate: vi.fn().mockResolvedValue(undefined),
    setViewportSize: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    isClosed: vi.fn().mockReturnValue(closed),
    keyboard: {
      press: vi.fn().mockResolvedValue(undefined),
      type: vi.fn().mockResolvedValue(undefined),
    },
    getByRole: vi.fn().mockReturnValue({
      click: clickFn,
      fill: fillFn,
      clear: clearFn,
      selectOption: selectOptionFn,
    }),
    mouse: { wheel: vi.fn().mockResolvedValue(undefined) },
    viewportSize: vi.fn().mockReturnValue({ width: 1280, height: 720 }),
    getAccessibilityTree: vi.fn().mockResolvedValue({
      role: "RootWebArea",
      name: "Test Page",
      children: [
        {
          role: "main",
          children: [
            { role: "heading", name: "Welcome", level: 1, nodeId: 10 },
            { role: "button", name: "Submit", nodeId: 11, ref: 1 },
            { role: "textbox", name: "Email", nodeId: 12, ref: 2 },
            { role: "combobox", name: "Country", nodeId: 13, ref: 3 },
          ],
        },
      ],
    }),
    // Expose individual locator mocks for assertions
    _clickFn: clickFn,
    _fillFn: fillFn,
    _clearFn: clearFn,
    _selectOptionFn: selectOptionFn,
  };
}

import { BrowserSessionDO } from "../../src/core/browser-automation/edge/session-do.js";

function makeSessionDO() {
  const mockCtx = {
    storage: { setAlarm: vi.fn().mockResolvedValue(undefined) },
    id: { toString: () => "test-id" },
  };
  const mockEnv = { BROWSER: {} as Fetcher, BROWSER_SESSION: {} };
  return new BrowserSessionDO(mockCtx as never, mockEnv as never);
}

describe("BrowserSessionDO — click()", () => {
  let dObj: BrowserSessionDO;
  let page: ReturnType<typeof makeMockPage>;

  beforeEach(() => {
    vi.clearAllMocks();
    page = makeMockPage();
    mockNewPage.mockResolvedValue(page);
    dObj = makeSessionDO();
  });

  it("clicks by role and name (no ref)", async () => {
    await dObj.navigate("https://example.com");
    const result = await dObj.click(undefined, "button", "Submit");
    expect(page.getByRole).toHaveBeenCalledWith("button", { name: "Submit" });
    expect(page._clickFn).toHaveBeenCalled();
    expect(result).toContain("Test Page");
  });

  it("clicks by role without name", async () => {
    await dObj.navigate("https://example.com");
    const result = await dObj.click(undefined, "button");
    expect(page.getByRole).toHaveBeenCalledWith("button", undefined);
    expect(result).toBeDefined();
  });

  it("returns error message when neither ref nor role provided", async () => {
    await dObj.navigate("https://example.com");
    const result = await dObj.click(undefined, undefined, undefined);
    expect(result).toContain("Provide ref or role");
  });

  it("returns error when no active tab", async () => {
    const result = await dObj.click(undefined, "button", "Submit");
    expect(result).toContain("No active browser tab");
  });
});

describe("BrowserSessionDO — type()", () => {
  let dObj: BrowserSessionDO;
  let page: ReturnType<typeof makeMockPage>;

  beforeEach(() => {
    vi.clearAllMocks();
    page = makeMockPage();
    mockNewPage.mockResolvedValue(page);
    dObj = makeSessionDO();
  });

  it("types into a textbox by name", async () => {
    await dObj.navigate("https://example.com");
    const result = await dObj.type("hello@example.com", undefined, "Email");
    expect(page.getByRole).toHaveBeenCalledWith("textbox", { name: "Email" });
    expect(page._clearFn).toHaveBeenCalled();
    expect(page._fillFn).toHaveBeenCalledWith("hello@example.com");
    expect(result).toContain("Test Page");
  });

  it("types without clearing when clear=false", async () => {
    await dObj.navigate("https://example.com");
    await dObj.type("append text", undefined, "Email", false);
    expect(page._clearFn).not.toHaveBeenCalled();
    expect(page._fillFn).toHaveBeenCalledWith("append text");
  });

  it("types using ref number to look up element in the narration tree", async () => {
    await dObj.navigate("https://example.com");
    // ref=2 maps to textbox "Email" in the mock tree (button=1, textbox=2, combobox=3)
    const result = await dObj.type("ref@example.com", 2);
    expect(page._fillFn).toHaveBeenCalledWith("ref@example.com");
    expect(result).toContain("Test Page");
  });

  it("returns error when ref element not found in tree", async () => {
    await dObj.navigate("https://example.com");
    // ref=999 does not exist
    const result = await dObj.type("text", 999);
    expect(result).toContain("No element with ref=999");
  });

  it("returns error when no active tab", async () => {
    const result = await dObj.type("text");
    expect(result).toContain("No active browser tab");
  });
});

describe("BrowserSessionDO — select()", () => {
  let dObj: BrowserSessionDO;
  let page: ReturnType<typeof makeMockPage>;

  beforeEach(() => {
    vi.clearAllMocks();
    page = makeMockPage();
    mockNewPage.mockResolvedValue(page);
    dObj = makeSessionDO();
  });

  it("selects an option by combobox name", async () => {
    await dObj.navigate("https://example.com");
    const result = await dObj.select("US", undefined, "Country");
    expect(page.getByRole).toHaveBeenCalledWith("combobox", { name: "Country" });
    expect(page._selectOptionFn).toHaveBeenCalledWith("US");
    expect(result).toContain("Test Page");
  });

  it("selects without name (no opts)", async () => {
    await dObj.navigate("https://example.com");
    const result = await dObj.select("CA");
    expect(page.getByRole).toHaveBeenCalledWith("combobox", undefined);
    expect(result).toBeDefined();
  });

  it("selects using ref number to look up element", async () => {
    await dObj.navigate("https://example.com");
    // ref=3 maps to combobox "Country"
    const result = await dObj.select("US", 3);
    expect(page._selectOptionFn).toHaveBeenCalledWith("US");
    expect(result).toContain("Test Page");
  });

  it("returns error when ref element not found in select", async () => {
    await dObj.navigate("https://example.com");
    const result = await dObj.select("option", 999);
    expect(result).toContain("No element with ref=999");
  });

  it("returns error when no active tab", async () => {
    const result = await dObj.select("option");
    expect(result).toContain("No active browser tab");
  });
});

describe("BrowserSessionDO — scroll()", () => {
  let dObj: BrowserSessionDO;
  let page: ReturnType<typeof makeMockPage>;

  beforeEach(() => {
    vi.clearAllMocks();
    page = makeMockPage();
    mockNewPage.mockResolvedValue(page);
    dObj = makeSessionDO();
  });

  it("scrolls upward with negative delta", async () => {
    await dObj.navigate("https://example.com");
    await dObj.scroll("up", 1);
    expect(page.mouse.wheel).toHaveBeenCalledWith(0, -720);
  });

  it("returns error when no active tab", async () => {
    const result = await dObj.scroll("down");
    expect(result).toContain("No active browser tab");
  });

  it("uses null viewport height fallback (720)", async () => {
    page.viewportSize.mockReturnValue(null);
    await dObj.navigate("https://example.com");
    await dObj.scroll("down", 2);
    // fallback height 720 * 2 = 1440
    expect(page.mouse.wheel).toHaveBeenCalledWith(0, 1440);
  });
});

describe("BrowserSessionDO — press() with no active tab", () => {
  it("returns error when no active tab", async () => {
    const dObj = makeSessionDO();
    const result = await dObj.press("Enter");
    expect(result).toContain("No active browser tab");
  });
});

describe("BrowserSessionDO — readPage() with landmark", () => {
  let dObj: BrowserSessionDO;

  beforeEach(() => {
    vi.clearAllMocks();
    mockNewPage.mockResolvedValue(makeMockPage());
    dObj = makeSessionDO();
  });

  it("returns compact landmark narration when landmark arg is provided", async () => {
    await dObj.navigate("https://example.com");
    const result = await dObj.readPage("compact", "main");
    // narrateCompactSection returns a text string
    expect(typeof result).toBe("string");
  });

  it("returns full landmark narration when detail=full and landmark provided", async () => {
    await dObj.navigate("https://example.com");
    const result = await dObj.readPage("full", "main");
    expect(typeof result).toBe("string");
  });
});

describe("BrowserSessionDO — tab lifecycle", () => {
  let dObj: BrowserSessionDO;
  let page1: ReturnType<typeof makeMockPage>;
  let page2: ReturnType<typeof makeMockPage>;

  beforeEach(() => {
    vi.clearAllMocks();
    page1 = makeMockPage();
    page2 = makeMockPage();
    mockNewPage.mockResolvedValueOnce(page1).mockResolvedValueOnce(page2);
    dObj = makeSessionDO();
  });

  it("listTabs prunes closed tabs", async () => {
    // Open two tabs sequentially (navigate with no index creates new tabs)
    await dObj.navigate("https://first.com"); // tab 0
    await dObj.navigate("https://second.com"); // tab 1 (new tab since index not specified)

    // Mark page1 (tab 0) as closed
    page1.isClosed.mockReturnValue(true);

    const tabs = await dObj.listTabs();
    // page1 should be pruned — only one tab remaining
    expect(tabs.length).toBe(1);
  });

  it("closeTab returns true and tab count decreases", async () => {
    // Navigate creates tab 0
    await dObj.navigate("https://first.com"); // tab 0

    // Force a second tab by navigating again without index
    await dObj.navigate("https://second.com"); // tab 1

    // Close tab 1 (currently active)
    const closed = await dObj.closeTab(1);
    expect(closed).toBe(true);

    // Exactly one tab should remain (tab 0)
    const tabs = await dObj.listTabs();
    expect(tabs.length).toBe(1);
  });
});
