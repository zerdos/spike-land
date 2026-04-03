import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MidiEditor } from "@/ui/components/music/MidiEditor";

// Mock lucide-react
vi.mock("lucide-react", () => ({
  Play: () => <svg data-testid="icon-play" />,
  Pause: () => <svg data-testid="icon-pause" />,
  Plus: () => <svg data-testid="icon-plus" />,
  Trash2: () => <svg data-testid="icon-trash" />,
  Download: () => <svg data-testid="icon-download" />,
  Music2: () => <svg data-testid="icon-music" />,
}));

// Mock canvas
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  scale: vi.fn(),
  roundRect: vi.fn(),
  font: "",
  textBaseline: "",
  fillText: vi.fn(),
  fillStyle: "",
  strokeStyle: "",
  lineWidth: 1,
}));

// Mock AudioContext
vi.stubGlobal(
  "AudioContext",
  vi.fn(() => ({
    createOscillator: vi.fn(() => ({
      type: "triangle",
      frequency: { value: 440 },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    })),
    createGain: vi.fn(() => ({
      gain: {
        value: 1,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        setTargetAtTime: vi.fn(),
      },
      connect: vi.fn(),
    })),
    currentTime: 0,
    destination: {},
    close: vi.fn(),
  })),
);

describe("MidiEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<MidiEditor />);
    expect(screen.getByText("MIDI Piano Roll")).toBeDefined();
  });

  it("shows format badge", () => {
    render(<MidiEditor />);
    expect(screen.getByText("midi")).toBeDefined();
  });

  it("shows BPM display", () => {
    render(<MidiEditor bpm={140} />);
    expect(screen.getByText("140 BPM")).toBeDefined();
  });

  it("shows play button", () => {
    render(<MidiEditor />);
    expect(screen.getByText("Play")).toBeDefined();
  });

  it("shows draw and erase tools", () => {
    render(<MidiEditor />);
    expect(screen.getByText("Draw")).toBeDefined();
    expect(screen.getByText("Erase")).toBeDefined();
  });

  it("shows note count", () => {
    render(<MidiEditor />);
    expect(screen.getByText("0 notes")).toBeDefined();
  });

  it("shows export button", () => {
    render(<MidiEditor />);
    expect(screen.getByText("Export")).toBeDefined();
  });

  it("shows instrument selector", () => {
    render(<MidiEditor />);
    const select = document.querySelector("select");
    expect(select).toBeDefined();
  });

  it("renders with initial notes", () => {
    const notes = [
      { id: "n1", pitch: 60, startTime: 0, duration: 1, velocity: 100, channel: 0 },
      { id: "n2", pitch: 64, startTime: 1, duration: 1, velocity: 80, channel: 0 },
    ];
    render(<MidiEditor initialNotes={notes} />);
    expect(screen.getByText("2 notes")).toBeDefined();
  });
});
