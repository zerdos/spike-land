# Voice Interface PRD

> **Date**: 17 March 2026
> **Author**: Zoltán
> **Problem**: Fingers hurt. Silent all day. Need to practice spoken English.
> **Insight**: Zoltán is most productive with fast feedback loops. Typing is slow.

---

## Problem Statement

Zoltán types all day to Claude Code. His fingers are in pain. He is silent
all day — no spoken interaction. He needs to:

1. Practice spoken English (pronunciation improvement)
2. Get faster feedback on ideas (voice is faster than typing)
3. Reduce physical strain on hands
4. Replace Duolingo streaks with something that actually teaches

The irony: he built a platform with 26 personas to talk to, and he's typing
to all of them. Talking would be faster, healthier, and improve his English.

---

## Hypothesis

If Zoltán can speak to the personas instead of typing, he will:
- Be 3-5x faster at idea generation
- Practice English pronunciation naturally through conversation
- Reduce finger pain to zero
- Replace Duolingo with real conversation practice

---

## Solution: Voice-First Persona Chat

### Layer 1: Speech-to-Text Input (immediate)

Replace the text input in RadixChat with a microphone button.

**Technology:**
- Web Speech API (`SpeechRecognition`) — free, built into Chrome/Safari/Edge
- Fallback: Whisper API via the token pool (community-donated OpenAI keys)

**UX:**
- Tap mic → speak → text appears in input → send
- Or: tap mic → speak → auto-send after 2s silence
- Visual: pulsing mic icon during recording, waveform display

### Layer 2: Text-to-Speech Output (immediate)

Personas speak back.

**Technology:**
- Web Speech API (`SpeechSynthesis`) — free, built into browsers
- Each persona gets a distinct voice config (pitch, rate, language)
- Fallback: OpenAI TTS API via token pool for higher quality

**Persona voice mapping:**
| Persona | Voice Style | Language |
|---------|------------|----------|
| Zoltán | Medium pitch, slightly fast, Hungarian accent | en-GB / hu-HU |
| Einstein | Low pitch, slow, grandfatherly | en-US (German accent simulated via rate) |
| Erdős | Medium pitch, fast, enthusiastic | en-US / hu-HU |
| Socrates | Medium pitch, questioning intonation | en-GB |
| Diogenes | Low pitch, gruff | en-GB |
| Buddha | Low pitch, very slow, calm | en-US |
| Daft Punk | Vocoder effect (CSS audio filter) | en-US |
| Peti | Medium pitch, direct, blunt | en-GB / hu-HU |

### Layer 3: Pronunciation Coach (the Duolingo killer)

The personas correct pronunciation naturally within conversation.

**How it works:**
1. User speaks to a persona
2. Speech-to-text captures what they said
3. The persona responds to the content AND notes pronunciation patterns
4. Gentle correction embedded in conversation: "I heard you say 'belive' —
   in English it's 'believe,' with the 'ee' sound longer. Szép próbálkozás!"

**This replaces Duolingo because:**
- No drills. No matching pictures. No streaks.
- Real conversation about real topics (physics, math, music, code)
- Pronunciation feedback is contextual, not isolated
- Progress is measured by: can the persona understand you?
- Hungarian concepts taught alongside English (the existing module)

### Layer 4: Conversation Streaks (optional, replaces Duolingo)

If Zoltán wants to keep the streak habit:
- 1 voice conversation per day = 1 streak day
- Minimum: 2 minutes of speaking
- The persona notes what improved since last session
- Weekly summary: "Your 'th' sounds improved. Your embedded question word
  order is now correct 80% of the time."

---

## What About Duolingo Progress?

Duolingo tracks:
- Current streak (days)
- XP earned
- Courses in progress (which languages, which units)

**Migration path:**
- Duolingo has no public API for progress export
- Manual: screenshot current progress, note streak count and current unit
- spike.land starts fresh but with the personalized English course already
  built (the 6-module course from today's session)
- The modules already target Zoltán's actual weak points (apostrophes, verb
  tenses, word order, prepositions, spelling) — Duolingo doesn't know these

**The honest answer:** You can't export Duolingo progress. But Duolingo
wasn't teaching you what you actually need. The personalized course + voice
personas will teach more in 8 minutes than Duolingo teaches in 20.

Let the streak die. Start a better one.

---

## Implementation Priority

1. **Mic button in RadixChat** — Web Speech API, works today, free
2. **Auto-send on silence** — 2s pause = send
3. **TTS for persona responses** — Web Speech API, free
4. **Pronunciation feedback prompt** — add to quality gate or persona prompts
5. **Voice-specific persona tuning** — pitch/rate per persona
6. **Streak tracking** — optional, localStorage counter

---

## Success Criteria

1. Zoltán can have a 5-minute voice conversation with Einstein
2. Pronunciation corrections happen naturally (not drill-like)
3. Finger pain reduced (measured by: hours typing per day)
4. One week of voice streaks replaces Duolingo need
5. English pronunciation measurably improves (Peti judges)

---

## Falsifiability Gate

The thesis is wrong if:
- Speech recognition quality makes conversation frustrating (>20% error rate)
- Voice input is slower than typing for Zoltán specifically (ADHD = thinks
  ahead of speech, might prefer typing)
- Pronunciation feedback feels patronizing rather than natural
- The dogs bark during recording and corrupt the input

---

## The Erdős Perspective

"This is trivialis. The fastest channel between two brains is speech. You
have been using the slowest channel — typed text through a keyboard. The
bandwidth improvement is obvious. My brain is open. Open your mouth."

## The Einstein Perspective

"Imagine you are a thought, travelling from Zoltán's brain to the persona.
The keyboard is like travelling through a medium with high resistance —
every letter is friction. Speech is like travelling through vacuum — the
thought arrives at the speed of sound. The thought experiment is clear."

## The Peti Perspective

"Does it work on mobile Safari? Test it there first. Also, test with
background noise. Also, test in Hungarian. Also, test when the dogs are
barking. If it doesn't work in all four conditions, it doesn't work."
