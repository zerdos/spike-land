import { useState, useEffect } from "react";
import { useQaStudioMcp } from "./useQaStudioMcp";
import { ConnectionPanel } from "./ConnectionPanel";
import { BrowserBar } from "./BrowserBar";
import { NarrationPanel } from "./NarrationPanel";
import { SidePanel } from "./SidePanel";
import { ConsolePanel } from "./ConsolePanel";

interface TabInfo {
  id: number;
  url: string;
  title: string;
}

interface FormInfo {
  selector: string;
  fields: Array<{ name: string; type: string; value?: string }>;
}

export default function QaStudioPage() {
  const mcp = useQaStudioMcp();
  const [narrationText, setNarrationText] = useState("");
  const [screenshotData, setScreenshotData] = useState<string | undefined>();
  const [tabsData, setTabsData] = useState<TabInfo[] | { text: string } | undefined>();
  const [formsData, setFormsData] = useState<FormInfo[] | { text: string } | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!errorMessage) return;
    const timer = setTimeout(() => setErrorMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [errorMessage]);

  const showError = (error: unknown) => {
    const msg = error instanceof Error ? error.message : String(error);
    setErrorMessage(msg);
    console.error(error);
  };

  const handleNavigate = async (url: string) => {
    try {
      const result = await mcp.callTool("web_navigate", { url });
      setNarrationText(result.content?.[0]?.text || "");
    } catch (error) {
      showError(error);
    }
  };

  const handleRefresh = async () => {
    try {
      const result = await mcp.callTool("web_read", {});
      setNarrationText(result.content?.[0]?.text || "");
    } catch (error) {
      showError(error);
    }
  };

  const handleScreenshot = async () => {
    try {
      const result = await mcp.callTool("web_screenshot", {});
      const imgContent = result.content?.find(
        (c) => c.type === "image" || c.mimeType === "image/png" || c.data,
      );
      if (imgContent?.data) {
        setScreenshotData(imgContent.data);
      }
    } catch (error) {
      showError(error);
    }
  };

  const handleRefClick = async (ref: number) => {
    try {
      const result = await mcp.callTool("web_click", { ref });
      setNarrationText(result.content?.[0]?.text || "");
    } catch (error) {
      showError(error);
    }
  };

  const handleGetForms = async () => {
    try {
      const result = await mcp.callTool("web_forms", {});
      const text = result.content?.[0]?.text;
      if (text) {
        try {
          setFormsData(JSON.parse(text));
        } catch {
          setFormsData({ text });
        }
      }
    } catch (error) {
      showError(error);
    }
  };

  const handleGetTabs = async () => {
    try {
      const result = await mcp.callTool("web_tabs", { action: "list" });
      const text = result.content?.[0]?.text;
      if (text) {
        try {
          setTabsData(JSON.parse(text));
        } catch {
          setTabsData({ text });
        }
      }
    } catch (error) {
      showError(error);
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
            <div className="w-4 h-4 bg-primary rounded-sm" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">QA Studio</h1>
            <p className="text-xs text-muted-foreground">Browser Automation Control</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionPanel
            url={mcp.url}
            connected={mcp.connected}
            onConnect={mcp.connect}
            onDisconnect={mcp.disconnect}
          />
        </div>
      </div>

      {errorMessage && (
        <div className="mx-4 mt-2 px-4 py-3 rounded-lg border border-destructive/30 bg-destructive/10 text-sm text-destructive flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-4 text-destructive/80 hover:text-destructive"
          >
            &times;
          </button>
        </div>
      )}

      <div className="flex flex-col flex-1 overflow-hidden">
        <BrowserBar
          onNavigate={handleNavigate}
          onRefresh={handleRefresh}
          onScreenshot={handleScreenshot}
          onGetForms={handleGetForms}
          onGetTabs={handleGetTabs}
          isCalling={mcp.isCalling}
        />

        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/2 min-w-[400px] border-r border-border overflow-hidden flex flex-col">
            <NarrationPanel
              text={narrationText}
              onRefClick={handleRefClick}
            />
          </div>

          <div className="w-1/2 min-w-[400px] overflow-hidden flex flex-col">
            <SidePanel
              {...(screenshotData !== undefined && { screenshotData })}
              tabsData={tabsData}
              formsData={formsData}
            />
          </div>
        </div>

        <ConsolePanel history={mcp.history} />
    </div>
  );
}
