import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const callTool = vi.fn();

vi.mock("@/ui/hooks/useQaStudioMcp", () => ({
  useQaStudioMcp: () => ({
    url: "http://localhost:3100/mcp",
    connected: true,
    history: [],
    isCalling: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    callTool,
  }),
}));

vi.mock("@/ui/components/qa-studio/ConnectionPanel", () => ({
  ConnectionPanel: () => <div>connection-panel</div>,
}));

vi.mock("@/ui/components/qa-studio/BrowserBar", () => ({
  BrowserBar: ({ onGetTabs }: { onGetTabs: () => void }) => (
    <button onClick={onGetTabs} type="button">
      Get Tabs
    </button>
  ),
}));

vi.mock("@/core-logic/NarrationPanel", () => ({
  NarrationPanel: () => <div>narration-panel</div>,
}));

vi.mock("@/ui/components/qa-studio/SidePanel", () => ({
  SidePanel: () => <div>side-panel</div>,
}));

vi.mock("@/ui/components/qa-studio/ConsolePanel", () => ({
  ConsolePanel: () => <div>console-panel</div>,
}));

describe("QaStudioPage", () => {
  beforeEach(() => {
    callTool.mockReset();
    callTool.mockResolvedValue({
      content: [{ type: "text", text: "[]" }],
    });
  });

  it("requests the tab list with the required MCP action", async () => {
    const { QaStudioPage } = await import("@/ui/routes/apps/qa-studio");

    render(<QaStudioPage />);
    fireEvent.click(screen.getByRole("button", { name: "Get Tabs" }));

    await waitFor(() => {
      expect(callTool).toHaveBeenCalledWith("web_tabs", { action: "list" });
    });
  });
});
