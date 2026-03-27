# PRD: One More Minute — Interactive Music Therapy Engine

## Vision
A progressive music experience built for David — who communicates through
rhythm, not words. Four personas (Radix, Zoltán, Erdős, Daft Punk) rotate
through 16 rounds, each adding layers to a collaborative composition.
Designed to lower blood pressure through binaural alpha-wave undertones
and gradual progressive build.

## User: David
- Cannot speak, but understands and creates rhythm
- Interaction model: tap/click on beat grid cells
- The beat grid IS his voice — every pattern he creates gets woven
  into the live arrangement

## Musical Architecture

### Tempo & Key
- **120 BPM** — therapeutic zone (lower than chasing's 138, higher than
  resting heart rate, designed to entrain cardiovascular rhythm downward)
- **Key: A minor** — universally melancholic yet hopeful
- **Binaural undertone**: 10Hz alpha wave (left ear 200Hz, right ear 210Hz)
  for blood pressure reduction and calm focus

### 16-Round Progressive Structure
Each round = 8 bars. Total runtime: ~4 minutes per full cycle.

| Round | Persona    | Adds                                | Intensity |
|-------|-----------|-------------------------------------|-----------|
| 1     | Radix     | Kick (4-on-floor) + sub bass        | 10%       |
| 2     | Erdős     | Hi-hat pattern (probability-based)  | 15%       |
| 3     | Zoltán    | Bass line (Am pentatonic walk)      | 25%       |
| 4     | Daft Punk | Filtered chord stab                 | 35%       |
| 5     | ALL       | David's beat grid activates         | 40%       |
| 6     | Radix     | Delay send opens                    | 50%       |
| 7     | Erdős     | Lead melody (random walk on scale)  | 55%       |
| 8     | Zoltán    | Arpeggiator layer                   | 65%       |
| 9     | Daft Punk | Vocoder phrase                      | 70%       |
| 10    | ALL       | Breakdown — strip to kick + pad     | 30%       |
| 11    | Radix     | Rebuild with ride cymbal            | 50%       |
| 12    | Erdős     | Probability snare fills             | 65%       |
| 13    | Zoltán    | Filter sweep automation             | 75%       |
| 14    | Daft Punk | Full drop — everything slams in     | 100%      |
| 15    | ALL       | David's grid pattern becomes lead   | 90%       |
| 16    | ALL       | Fade to binaural only — peace       | 5%        |

### Persona Sound Signatures
- **Radix** (Engineer): Kick, sub, structural rhythm — the foundation
- **Erdős** (Probability): Stochastic hi-hats, random walk melodies —
  every note is a probability, not a certainty
- **Zoltán** (Mathematician): Bass lines, arpeggios, filter sweeps —
  patterns within patterns, fixed-point convergence
- **Daft Punk** (Signal): Chords, vocoder, the drop — turning math
  into something you can dance to

## Therapeutic Design

### Blood Pressure Reduction
1. **Binaural beat**: 10Hz difference tone (alpha wave) plays
   continuously at low volume — clinically associated with reduced
   systolic blood pressure
2. **Tempo entrainment**: 120 BPM gradually syncs heart rate
3. **Progressive build**: avoids sudden spikes — intensity ramps
   smoothly, never jumps
4. **Round 16 fade**: everything dissolves to just the binaural
   tone and a soft pad — guided return to calm

### David's Interaction Model
- 4×4 beat grid (16 steps per bar)
- 4 rows: kick, snare, hat, melody note
- Tap to toggle cells on/off
- His pattern loops and is quantized to the global clock
- In Round 5, his grid activates and joins the mix
- In Round 15, his grid pattern becomes the dominant melody

## Technical Architecture

### React Component Tree
```
<App>
  <StarfieldCanvas />
  <TunnelCanvas />
  <VisualizerCanvas />
  <Header round={currentRound} persona={activePersona} />
  <Transport playing={} onPlay={} onStop={} />
  <BeatGrid grid={} onToggle={} active={} />
  <RoundIndicator round={} total={16} />
  <PersonaPanel personas={} active={} speaking={} />
  <AnnotationFeed messages={} />
  <BinauralIndicator active={} />
</App>
```

### Audio Engine (Custom Hook: useAudioEngine)
- Web Audio API with full chain:
  master → filter → reverb/dry → compressor → analyser → destination
- Binaural oscillator pair (bypasses filter chain, direct to destination)
- 16-step sequencer running on requestAnimationFrame + lookahead
- Per-instrument gain nodes for progressive mix control
- Round-based arrangement engine

### State Management
- React useState/useRef for UI state
- AudioContext refs for real-time audio (never in React state)
- Round progression via useEffect timer

## Success Metric
David smiles. Zoltán's blood pressure drops. The music plays.
That's the whole spec.
