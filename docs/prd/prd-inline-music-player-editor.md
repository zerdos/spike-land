# PRD: Inline Music Player & Editor for Zoltan Chat

## Introduction

When users in Zoltan chat discuss music — whether asking to hear something, sharing a link, uploading a file, or requesting a composition — the platform should detect musical context and render an interactive music player/editor component **inline within the chat message**. The editor is DAW-style with a multi-track timeline, effects, and support for all major music formats (ABC notation, Tone.js/Web Audio code, and MIDI). Users can both listen to AI-generated music and compose from scratch, all without leaving the conversation.

## Goals

- Detect music-related intent in chat messages and auto-render a `<MusicPlayer>` component inline
- Support three input formats: ABC notation, Tone.js/Web Audio API code, and MIDI files
- Provide a DAW-like timeline editor with tracks, effects, and mixing capabilities
- Enable real-time playback with instant feedback on edits
- Full feature set: multiple formats, export, sharing, collaborative editing
- Zero navigation — everything happens inside the chat bubble

## User Stories

### US-001: Music Intent Detection
**Description:** As a chat user, I want the system to automatically detect when I'm talking about music so that the player/editor appears without me having to explicitly request it.

**Acceptance Criteria:**
- [ ] NLP-based detection of music-related keywords, URLs, file uploads, and code patterns
- [ ] Detection covers: YouTube/Spotify URLs, `.mp3`/`.wav`/`.mid` uploads, ABC notation blocks, Tone.js code, explicit requests ("play", "compose", "remix")
- [ ] False positive rate < 5% — non-music code blocks should not trigger the player
- [ ] Typecheck passes

### US-002: Inline Audio Playback
**Description:** As a user, I want to hear music directly in the chat message so that I don't need to open a separate app or tab.

**Acceptance Criteria:**
- [ ] `<MusicPlayer>` renders inline within the chat message (like an interactive code block)
- [ ] Waveform visualization via Web Audio API `AnalyserNode` at 60fps
- [ ] Play/pause, seek (click/drag on waveform), volume, mute controls
- [ ] Keyboard shortcuts: Space (play/pause), Left/Right arrows (seek +/-5s)
- [ ] Only one player plays at a time across the chat; starting one pauses others
- [ ] Current position and duration displayed in `mm:ss`
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-003: ABC Notation Rendering & Playback
**Description:** As a user, I want to write or receive ABC notation in chat and hear it played back instantly.

**Acceptance Criteria:**
- [ ] Detect ABC notation blocks (starting with `X:`, `T:`, `M:`, `K:`)
- [ ] Render ABC as sheet music notation (using abcjs or similar)
- [ ] Play ABC notation via MIDI synthesis (Web Audio oscillators or soundfont)
- [ ] Editable ABC text area — changes re-render the score and update playback in real-time
- [ ] Syntax highlighting for ABC notation
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-004: Tone.js / Web Audio Code Editor
**Description:** As a user, I want to write Tone.js or Web Audio API code in the chat editor and hear the result immediately.

**Acceptance Criteria:**
- [ ] Monaco-based code editor with Tone.js/Web Audio API autocompletion
- [ ] "Run" button executes the code in a sandboxed audio context
- [ ] Real-time audio output routed to the inline player's waveform
- [ ] Error display for invalid code (syntax errors, runtime errors)
- [ ] Code templates/snippets for common patterns (synth, drum pattern, arpeggio)
- [ ] Sandboxed execution — user code cannot access DOM or network
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: MIDI Import, Playback & Editing
**Description:** As a user, I want to load MIDI files and edit them on a piano roll.

**Acceptance Criteria:**
- [ ] Load `.mid` files via drag-and-drop or file picker
- [ ] Render MIDI as piano roll visualization (time on X axis, pitch on Y axis)
- [ ] Playback using GM soundfont via Web Audio
- [ ] Basic editing: add, remove, move, resize notes on the piano roll
- [ ] Export edited MIDI as `.mid` file
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-006: DAW-Style Multi-Track Timeline
**Description:** As a user, I want a multi-track timeline where I can layer and mix multiple audio sources.

**Acceptance Criteria:**
- [ ] Up to 8 tracks stacked vertically, each with independent waveform
- [ ] Per-track: volume fader, pan knob, mute, solo buttons
- [ ] Master bus with combined waveform and master volume
- [ ] Drag tracks to offset start position for time-alignment
- [ ] Mixdown to stereo WAV or MP3 via offline audio context
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-007: Effects Chain
**Description:** As a user, I want to apply audio effects to individual tracks.

**Acceptance Criteria:**
- [ ] Per-track effects chain with drag-to-reorder
- [ ] Built-in effects: EQ (3-band parametric), reverb, delay, compressor, distortion, chorus
- [ ] Each effect: bypass toggle, wet/dry mix
- [ ] Presets: "Radio Voice", "Lo-Fi", "Concert Hall", "Telephone", "Underwater"
- [ ] Save custom presets
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-008: AI Music Generation
**Description:** As a user, I want to describe music in natural language and get a generated audio clip.

**Acceptance Criteria:**
- [ ] Text prompt → audio clip (5-30s) via MCP music generation tool
- [ ] Parameters: duration, genre, tempo, key hints
- [ ] Generated audio loads directly into the inline player
- [ ] Generated tracks are editable in the DAW timeline
- [ ] Saved to user session for later access
- [ ] Typecheck passes

### US-009: YouTube & Spotify Integration
**Description:** As a user, I want to share YouTube or Spotify links and have them play inline.

**Acceptance Criteria:**
- [ ] Auto-detect YouTube and Spotify URLs in messages
- [ ] YouTube: embedded player via IFrame API with waveform-style controls
- [ ] Spotify: embed player with metadata extraction via oEmbed
- [ ] Consistent UI wrapper matching the chat theme
- [ ] Respect platform ToS (no downloads, embed-only)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-010: Export & Sharing
**Description:** As a user, I want to export my music in multiple formats and share it.

**Acceptance Criteria:**
- [ ] Export formats: WAV (16/24-bit), MP3 (128/192/320 kbps), OGG, FLAC, AAC, MIDI
- [ ] Project export as `.spike-music` JSON bundle (tracks, edits, effects, annotations)
- [ ] Share via direct download link or clipboard
- [ ] Batch export playlist as ZIP
- [ ] Embedded metadata (title, artist, BPM, key, mood tags)
- [ ] Typecheck passes

### US-011: Real-Time Collaboration
**Description:** As a user, I want to edit music together with other chat participants in real-time.

**Acceptance Criteria:**
- [ ] Multiple users can edit the same track simultaneously
- [ ] Edits synced via WebSocket through spike-land-backend Durable Object
- [ ] Visible cursors of other editors on the waveform/piano roll
- [ ] Presence indicators showing who is viewing/editing
- [ ] Conflict resolution: last-write-wins for parameters, additive for annotations
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-012: MCP Tool Registration
**Description:** As a developer, I want music capabilities exposed as MCP tools for composability.

**Acceptance Criteria:**
- [ ] Tools registered: `music.play`, `music.analyze`, `music.generate`, `music.remix`, `music.export`
- [ ] Zod-validated input/output schemas for each tool
- [ ] Tools are composable (chain generate → analyze → export)
- [ ] Rate limiting: 100 generations/day free, unlimited Pro
- [ ] Typecheck passes

## Functional Requirements

- FR-1: Detect music intent in chat messages (NLP keywords, URLs, file types, code patterns)
- FR-2: Render `<MusicPlayer>` inline in chat messages as interactive component
- FR-3: Support ABC notation parsing, rendering (sheet music), and playback
- FR-4: Support Tone.js/Web Audio code editing with sandboxed execution
- FR-5: Support MIDI file import, piano roll editing, and playback via soundfont
- FR-6: Multi-track DAW timeline with up to 8 tracks, per-track controls
- FR-7: Per-track effects chain (EQ, reverb, delay, compressor, distortion, chorus)
- FR-8: AI music generation from text prompts via MCP tool
- FR-9: YouTube and Spotify URL detection and inline embed playback
- FR-10: File upload (MP3, WAV, FLAC, OGG, AAC, WebM, MIDI) to R2 storage
- FR-11: Audio analysis: beat detection, BPM calculation, key detection, mood tagging
- FR-12: Trim, cut, loop, speed control, pitch shift editing tools
- FR-13: Export in WAV, MP3, OGG, FLAC, AAC, MIDI formats
- FR-14: Real-time collaborative editing via Durable Objects WebSocket
- FR-15: Shared playlists as Durable Objects with crossfade playback
- FR-16: Version history with auto-save, diff view, and restore
- FR-17: Register music tools in spike-land-mcp registry
- FR-18: `<MusicPlayer>` MDX component for blog post embedding
- FR-19: Package music projects as spike.land app store items
- FR-20: Analytics dashboard for usage metrics (privacy-first, aggregated)

## Non-Goals

- No desktop DAW replacement — this is a chat-embedded tool, not Ableton
- No raw audio recording from microphone (future consideration)
- No video editing or music video creation
- No integration with hardware MIDI controllers
- No offline-first mode (requires internet for generation, collaboration, cloud storage)
- No monetization of user-generated music — users own their creations

## Design Considerations

- The player/editor renders **inside chat messages** like a rich interactive code block
- Compact by default (waveform + controls), expandable to full DAW view
- Dark/light theme support, inheriting from chat theme
- Mobile: full feature parity on touch devices, responsive layout
- Accessibility: WCAG 2.1 AA, keyboard navigation throughout
- Reuse existing Monaco editor from `src/code` package for code editing
- Reuse Durable Objects infrastructure from `src/spike-land-backend` for collaboration

## Technical Considerations

- **Web Audio API** — core audio processing, analysis, effects
- **Tone.js** — high-level audio synthesis and scheduling
- **abcjs** — ABC notation parsing and rendering
- **Soundtouch.js** — pitch shifting
- **hls.js / dash.js** — streaming format support
- **Web Workers** — background analysis (beat detection, key detection, BPM)
- **WASM** — performance-critical audio processing
- **spike-edge** — proxy, upload, metadata extraction API
- **spike-land-backend Durable Objects** — real-time collaboration, playlists
- **R2 Storage** — audio file persistence
- **spike-land-mcp** — MCP tool registration
- **IndexedDB** — client-side caching for offline replay

## Success Metrics

| Metric | Target |
|--------|--------|
| Time to first playback from music mention | < 2 seconds |
| Audio editing latency (trim, pitch, speed) | < 100ms perceived |
| Concurrent collaborative editors | 8+ per session |
| AI music generation time (30s clip) | < 15 seconds |
| Supported import formats | 7+ (MP3, WAV, FLAC, OGG, AAC, WebM, MIDI) |
| Mobile responsiveness | Full feature parity |
| Accessibility | WCAG 2.1 AA |
| False positive music detection rate | < 5% |

## Open Questions

- Which AI music generation model to use? (MusicGen, Stable Audio, custom?)
- Should we support VST/AU plugin loading via WebAssembly?
- How to handle copyright detection for uploaded/generated content?
- Should the DAW view be a separate route or always inline?
- What is the storage quota per user for audio files on R2?
- Should we integrate with external DAWs via MIDI clock sync?
