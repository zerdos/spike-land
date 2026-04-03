import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ABCEditor } from "@/ui/components/music/ABCEditor";

// Mock lucide-react
vi.mock("lucide-react", () => ({
  Edit3: () => <svg data-testid="icon-edit" />,
  Music: () => <svg data-testid="icon-music" />,
  Play: () => <svg data-testid="icon-play" />,
  Pause: () => <svg data-testid="icon-pause" />,
  RotateCcw: () => <svg data-testid="icon-rotate" />,
  Repeat: () => <svg data-testid="icon-repeat" />,
  SkipBack: () => <svg data-testid="icon-skip-back" />,
  SkipForward: () => <svg data-testid="icon-skip-forward" />,
  Volume2: () => <svg data-testid="icon-volume" />,
  VolumeX: () => <svg data-testid="icon-volume-x" />,
}));

// Mock Web Audio API
const mockOfflineContext = {
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
  destination: {},
  startRendering: vi.fn(() =>
    Promise.resolve({
      duration: 2,
      length: 88200,
      numberOfChannels: 1,
      sampleRate: 44100,
      getChannelData: vi.fn(() => new Float32Array(88200)),
    }),
  ),
};

vi.stubGlobal(
  "OfflineAudioContext",
  vi.fn(() => mockOfflineContext),
);

const mockAudioContext = {
  createGain: vi.fn(() => ({
    gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
  })),
  createAnalyser: vi.fn(() => ({
    fftSize: 2048,
    frequencyBinCount: 1024,
    connect: vi.fn(),
    getFloatTimeDomainData: vi.fn(),
    getByteFrequencyData: vi.fn(),
  })),
  createBufferSource: vi.fn(() => ({
    buffer: null,
    playbackRate: { value: 1 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  })),
  currentTime: 0,
  destination: {},
  state: "running",
  resume: vi.fn(),
  close: vi.fn(),
};

vi.stubGlobal(
  "AudioContext",
  vi.fn(() => mockAudioContext),
);

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
  setLineDash: vi.fn(),
  fillStyle: "",
  strokeStyle: "",
  lineWidth: 1,
}));

describe("ABCEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const SAMPLE_ABC = `X:1
T:Twinkle Twinkle
M:4/4
Q:120
K:C
CCGG|AAG2|FFEE|DDC2|`;

  it("renders without crashing", () => {
    render(<ABCEditor initialCode={SAMPLE_ABC} />);
    // Should show the sheet music area
    expect(document.querySelector(".abc-sheet")).toBeDefined();
  });

  it("renders the SVG sheet music", () => {
    render(<ABCEditor initialCode={SAMPLE_ABC} />);
    const sheet = document.querySelector(".abc-sheet");
    expect(sheet).toBeDefined();
    // Should contain SVG content
    expect(sheet?.innerHTML).toContain("svg");
  });

  it("shows metadata from ABC headers", () => {
    render(<ABCEditor initialCode={SAMPLE_ABC} />);
    // Title is rendered in the MusicPlayer header
    expect(screen.getByText("Twinkle Twinkle")).toBeDefined();
  });

  it("shows abc format badge", () => {
    render(<ABCEditor initialCode={SAMPLE_ABC} />);
    expect(screen.getByText("abc")).toBeDefined();
  });
});
