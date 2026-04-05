import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DAWTimeline } from "@/ui/components/music/DAWTimeline";

// Mock lucide-react
vi.mock("lucide-react", () => ({
  Volume2: () => <svg data-testid="icon-volume" />,
  VolumeX: () => <svg data-testid="icon-volume-x" />,
  Headphones: () => <svg data-testid="icon-headphones" />,
  Plus: () => <svg data-testid="icon-plus" />,
  Trash2: () => <svg data-testid="icon-trash" />,
  GripVertical: () => <svg data-testid="icon-grip" />,
  Download: () => <svg data-testid="icon-download" />,
  Sliders: () => <svg data-testid="icon-sliders" />,
}));

describe("DAWTimeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<DAWTimeline />);
    expect(screen.getByText("Multi-Track Mixer")).toBeDefined();
  });

  it("shows default 2 tracks", () => {
    render(<DAWTimeline />);
    expect(screen.getByText("2/8 tracks")).toBeDefined();
  });

  it("shows add track button", () => {
    render(<DAWTimeline />);
    expect(screen.getByText("Add Track")).toBeDefined();
  });

  it("shows mixdown button", () => {
    render(<DAWTimeline />);
    expect(screen.getByText("Mixdown")).toBeDefined();
  });

  it("shows master bus", () => {
    render(<DAWTimeline />);
    expect(screen.getByText("Master")).toBeDefined();
  });

  it("can add a track", () => {
    render(<DAWTimeline />);
    fireEvent.click(screen.getByText("Add Track"));
    expect(screen.getByText("3/8 tracks")).toBeDefined();
  });

  it("shows track controls (mute/solo)", () => {
    render(<DAWTimeline />);
    const muteButtons = screen.getAllByTitle("Mute");
    expect(muteButtons.length).toBeGreaterThanOrEqual(2);
    const soloButtons = screen.getAllByTitle("Solo");
    expect(soloButtons.length).toBeGreaterThanOrEqual(2);
  });

  it("shows empty state when no tracks", () => {
    render(<DAWTimeline initialTracks={[]} />);
    expect(screen.getByText(/No tracks/)).toBeDefined();
  });
});
