import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

async function renderMadMaxProtocol() {
  const { MadMaxProtocol } = await import("@/ui/components/MadMaxProtocol");
  return render(<MadMaxProtocol />);
}

describe("MadMaxProtocol", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
    vi.restoreAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(null, { status: 204 }))),
    );
  });

  it("does not show when onboarding has not been completed", async () => {
    await renderMadMaxProtocol();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows modal after onboarding is completed", async () => {
    localStorage.setItem("spike_onboarding_shown", "1");
    await renderMadMaxProtocol();
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("does not show when already dismissed", async () => {
    localStorage.setItem("spike_onboarding_shown", "1");
    localStorage.setItem("spike_madmax_protocol_shown", "1");
    await renderMadMaxProtocol();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("locks document scrolling while open", async () => {
    localStorage.setItem("spike_onboarding_shown", "1");
    await renderMadMaxProtocol();
    await screen.findByRole("dialog");

    expect(document.body.style.overflow).toBe("hidden");
    expect(document.documentElement.style.overflow).toBe("hidden");
  });

  it("shows step 0 content on open", async () => {
    localStorage.setItem("spike_onboarding_shown", "1");
    await renderMadMaxProtocol();
    await screen.findByRole("dialog");

    expect(screen.getByText("MAD MAX PROTOCOL")).toBeInTheDocument();
    expect(screen.getByText("Defense Protocol Activated")).toBeInTheDocument();
  });

  it("navigates to step 1 on View Intelligence click", async () => {
    localStorage.setItem("spike_onboarding_shown", "1");
    await renderMadMaxProtocol();
    await screen.findByText("View Intelligence");

    fireEvent.click(screen.getByText("View Intelligence"));

    expect(screen.getByText("Field Analysis")).toBeInTheDocument();
    expect(screen.getByText("VMO2 Detected")).toBeInTheDocument();
  });

  it("navigates to step 2 on See Target click", async () => {
    localStorage.setItem("spike_onboarding_shown", "1");
    await renderMadMaxProtocol();
    await screen.findByText("View Intelligence");

    fireEvent.click(screen.getByText("View Intelligence"));
    fireEvent.click(screen.getByText("See Target"));

    expect(screen.getByText("Next Target: VMO2")).toBeInTheDocument();
  });

  it("navigates back from step 1", async () => {
    localStorage.setItem("spike_onboarding_shown", "1");
    await renderMadMaxProtocol();
    await screen.findByText("View Intelligence");

    fireEvent.click(screen.getByText("View Intelligence"));
    fireEvent.click(screen.getByText("Back"));

    expect(screen.getByText("MAD MAX PROTOCOL")).toBeInTheDocument();
  });

  it("dismisses on Protocol Acknowledged click from step 2", async () => {
    localStorage.setItem("spike_onboarding_shown", "1");
    await renderMadMaxProtocol();
    await screen.findByText("View Intelligence");

    fireEvent.click(screen.getByText("View Intelligence"));
    fireEvent.click(screen.getByText("See Target"));
    fireEvent.click(screen.getByText("Protocol Acknowledged"));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    expect(localStorage.getItem("spike_madmax_protocol_shown")).toBe("1");
  });

  it("dismisses on Dismiss click from step 0", async () => {
    localStorage.setItem("spike_onboarding_shown", "1");
    await renderMadMaxProtocol();
    await screen.findByRole("dialog");

    fireEvent.click(screen.getByText("Dismiss"));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("dismisses on X button click", async () => {
    localStorage.setItem("spike_onboarding_shown", "1");
    await renderMadMaxProtocol();
    await screen.findByRole("dialog");

    fireEvent.click(screen.getByLabelText("Close"));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("restores document scrolling after dismiss", async () => {
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "clip";

    localStorage.setItem("spike_onboarding_shown", "1");
    await renderMadMaxProtocol();
    await screen.findByRole("dialog");

    fireEvent.click(screen.getByText("Dismiss"));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    expect(document.body.style.overflow).toBe("auto");
    expect(document.documentElement.style.overflow).toBe("clip");
  });

  it("shows step indicators", async () => {
    localStorage.setItem("spike_onboarding_shown", "1");
    const { container } = await renderMadMaxProtocol();
    await screen.findByRole("dialog");

    const indicators = container.querySelectorAll('[role="progressbar"] > div');
    expect(indicators).toHaveLength(3);
  });

  it("shows all three findings on step 1", async () => {
    localStorage.setItem("spike_onboarding_shown", "1");
    await renderMadMaxProtocol();
    await screen.findByText("View Intelligence");

    fireEvent.click(screen.getByText("View Intelligence"));

    expect(screen.getByText("VMO2 Detected")).toBeInTheDocument();
    expect(screen.getByText("Switchboard Intelligence")).toBeInTheDocument();
    expect(screen.getByText("Strange Loop Anomaly")).toBeInTheDocument();
  });

  it("shows blog links on step 2", async () => {
    localStorage.setItem("spike_onboarding_shown", "1");
    await renderMadMaxProtocol();
    await screen.findByText("View Intelligence");

    fireEvent.click(screen.getByText("View Intelligence"));
    fireEvent.click(screen.getByText("See Target"));

    expect(screen.getByText("Read the full field report")).toHaveAttribute(
      "href",
      "/blog/mad-max-protocol",
    );
    expect(screen.getByText("Investigate the Strange Loop")).toHaveAttribute(
      "href",
      "/blog/the-strange-loop-valued-at-ten-trillion",
    );
  });
});
