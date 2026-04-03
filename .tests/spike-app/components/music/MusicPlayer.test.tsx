import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MusicPlayer } from "@/ui/components/music/MusicPlayer";

// Mock lucide-react
vi.mock("lucide-react", () => ({
  Pause: () => <svg data-testid="icon-pause" />,
  Play: () => <svg data-testid="icon-play" />,
  Repeat: () => <svg data-testid="icon-repeat" />,
  SkipBack: () => <svg data-testid="icon-skip-back" />,
  SkipForward: () => <svg data-testid="icon-skip-forward" />,
  Volume2: () => <svg data-testid="icon-volume" />,
  VolumeX: () => <svg data-testid="icon-volume-x" />,
}));

// Mock Web Audio API
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
    loop: false,
    loopStart: 0,
    loopEnd: 0,
  })),
  decodeAudioData: vi.fn(),
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
  setLineDash: vi.fn(),
  fillStyle: "",
  strokeStyle: "",
  lineWidth: 1,
}));

describe("MusicPlayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<MusicPlayer />);
    expect(screen.getByRole("region")).toBeDefined();
  });

  it("renders with metadata", () => {
    render(
      <MusicPlayer
        meta={{ title: "Test Song", artist: "Test Artist", bpm: 120, key: "C minor" }}
        format="audio"
      />,
    );
    expect(screen.getByText("Test Song")).toBeDefined();
    expect(screen.getByText("Test Artist")).toBeDefined();
    expect(screen.getByText("120 BPM")).toBeDefined();
    expect(screen.getByText("C minor")).toBeDefined();
    expect(screen.getByText("audio")).toBeDefined();
  });

  it("shows play button by default", () => {
    render(<MusicPlayer />);
    expect(screen.getByLabelText("Play")).toBeDefined();
  });

  it("shows time display", () => {
    render(<MusicPlayer />);
    expect(screen.getByText("0:00 / 0:00")).toBeDefined();
  });

  it("renders skip buttons", () => {
    render(<MusicPlayer />);
    expect(screen.getByLabelText("Skip back 5 seconds")).toBeDefined();
    expect(screen.getByLabelText("Skip forward 5 seconds")).toBeDefined();
  });

  it("renders loop toggle", () => {
    render(<MusicPlayer />);
    expect(screen.getByLabelText("Enable loop")).toBeDefined();
  });

  it("renders speed selector", () => {
    render(<MusicPlayer />);
    expect(screen.getByLabelText("Playback speed: 1x")).toBeDefined();
  });

  it("renders volume button", () => {
    render(<MusicPlayer />);
    expect(screen.getByLabelText("Mute")).toBeDefined();
  });

  it("shows loading state when src is provided", () => {
    // Mock fetch to never resolve
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    render(<MusicPlayer src="https://example.com/song.mp3" />);
    expect(screen.getByText("Loading audio...")).toBeDefined();
  });

  it("renders children when expanded", () => {
    render(
      <MusicPlayer expandable>
        <div data-testid="child-content">Editor panel</div>
      </MusicPlayer>,
    );
    // Children should not be visible by default (not expanded)
    expect(screen.queryByTestId("child-content")).toBeNull();
  });
});
