import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InstallButton } from "@/ui/components/store/InstallButton";

// ---------------------------------------------------------------------------
// Mock useInstall
// ---------------------------------------------------------------------------

const mockInstall = vi.fn();
const mockUninstall = vi.fn();

vi.mock("@/ui/hooks/useInstall", () => ({
  useInstall: vi.fn(() => ({
    isInstalled: false,
    installCount: 0,
    isStatusLoading: false,
    isInstalling: false,
    isUninstalling: false,
    install: mockInstall,
    uninstall: mockUninstall,
    mutationError: null,
  })),
}));

import { useInstall } from "@/ui/hooks/useInstall";

const mockUseInstall = vi.mocked(useInstall);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("InstallButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInstall.mockResolvedValue(undefined);
    mockUninstall.mockResolvedValue(undefined);
  });

  it("renders GET button when not installed", () => {
    render(<InstallButton slug="qa-studio" appName="QA Studio" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByRole("button", { name: /install qa studio/i })).toBeInTheDocument();
    expect(screen.getByText("GET")).toBeInTheDocument();
  });

  it("calls install() when GET is clicked", async () => {
    render(<InstallButton slug="qa-studio" appName="QA Studio" />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByRole("button", { name: /install qa studio/i }));

    await waitFor(() => {
      expect(mockInstall).toHaveBeenCalledTimes(1);
    });
  });

  it("renders Installed button when installed", () => {
    mockUseInstall.mockReturnValueOnce({
      isInstalled: true,
      installCount: 5,
      isStatusLoading: false,
      isInstalling: false,
      isUninstalling: false,
      install: mockInstall,
      uninstall: mockUninstall,
      mutationError: null,
    });

    render(<InstallButton slug="qa-studio" appName="QA Studio" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByRole("button", { name: /uninstall qa studio/i })).toBeInTheDocument();
    expect(screen.getByText("Installed")).toBeInTheDocument();
  });

  it("shows confirmation dialog before uninstalling", async () => {
    mockUseInstall.mockReturnValue({
      isInstalled: true,
      installCount: 5,
      isStatusLoading: false,
      isInstalling: false,
      isUninstalling: false,
      install: mockInstall,
      uninstall: mockUninstall,
      mutationError: null,
    });

    render(<InstallButton slug="qa-studio" appName="QA Studio" />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByRole("button", { name: /uninstall qa studio/i }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText(/Uninstall QA Studio/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /keep/i }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    expect(mockUninstall).not.toHaveBeenCalled();
  });

  it("calls uninstall() when confirmed in dialog", async () => {
    mockUseInstall.mockReturnValue({
      isInstalled: true,
      installCount: 5,
      isStatusLoading: false,
      isInstalling: false,
      isUninstalling: false,
      install: mockInstall,
      uninstall: mockUninstall,
      mutationError: null,
    });

    render(<InstallButton slug="qa-studio" appName="QA Studio" />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByRole("button", { name: /uninstall qa studio/i }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /^uninstall$/i }));

    await waitFor(() => {
      expect(mockUninstall).toHaveBeenCalledTimes(1);
    });
  });

  it("shows loading state during install", () => {
    mockUseInstall.mockReturnValueOnce({
      isInstalled: false,
      installCount: 0,
      isStatusLoading: false,
      isInstalling: true,
      isUninstalling: false,
      install: mockInstall,
      uninstall: mockUninstall,
      mutationError: null,
    });

    render(<InstallButton slug="qa-studio" appName="QA Studio" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText("Installing…")).toBeInTheDocument();
  });

  it("is disabled while loading status", () => {
    mockUseInstall.mockReturnValueOnce({
      isInstalled: false,
      installCount: 0,
      isStatusLoading: true,
      isInstalling: false,
      isUninstalling: false,
      install: mockInstall,
      uninstall: mockUninstall,
      mutationError: null,
    });

    render(<InstallButton slug="qa-studio" appName="QA Studio" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByRole("button", { name: /install qa studio/i })).toBeDisabled();
  });
});
