/**
 * generate-elvis-voices.ts — Generate all ElevenLabs TTS voice clips
 * for the Elvis Emotion Remotion composition.
 *
 * Usage: node --import tsx scripts/generate-elvis-voices.ts
 */
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("ELEVENLABS_API_KEY not set");
  process.exit(1);
}

const AUDIO_DIR = path.resolve(process.cwd(), "src/media/educational-videos/public/audio");

// ── Voice mapping: persona voice description → ElevenLabs voice_id ────────
// We map each persona to the best-matching available voice from the account.
// 27 voices available, 48+ personas — we reuse voices across groups but
// try to maximize variety within each scene.

const VOICE_MAP: Record<string, string> = {
  // HOSTS
  "host-a": "nPczCjzI2devNBz1zQrb", // Brian - Deep, Resonant and Comforting (warm male)
  "host-b": "EXAVITQu4vr4xnSDxMaL", // Sarah - Mature, Reassuring (warm female)

  // PHILOSOPHERS
  socrates: "pqHfZKP75CvOlQylNhV4", // Bill - Wise, Mature (older male, questioning)
  diogenes: "N2lVS1w4EtoT3dr4eOWO", // Callum - Husky Trickster (raspy, irreverent)
  plato: "JBFqnCBsd6RMkjVDRZzb", // George - Warm Storyteller (measured baritone)
  aristotle: "onwK4e9ZLuTAKqWW03F9", // Daniel - Steady Broadcaster (professorial)
  nietzsche: "pNInz6obpgDQGcFmaJgB", // Adam - Dominant, Firm (intense, passionate)
  kant: "cjVigY5qzO86Huf0OWal", // Eric - Smooth, Trustworthy (precise, formal)
  "marcus-aurelius": "CwhRBWXzGAHq8TQ4Fs17", // Roger - Laid-Back (calm, gravelly)
  wittgenstein: "zJHjjptBvLo2jJYGrWaB", // Edmund - Full range emotions (clipped, matter-of-fact)
  buddha: "SAz9YHcvj6GT2YYXdXww", // River - Relaxed, Neutral (gentle, soft)
  camus: "GFj5Qf6cNQ3Lgp8VKBwc", // Olivier D - Old man (French male!)
  simone: "pFZP5JQG7iQjIQuC4Bku", // Lily - Velvety Actress (confident female)
  arendt: "Xb7hH8MSUJpSbSDYk0k2", // Alice - Clear Educator (intellectual female)

  // PUBLIC FIGURES
  trump: "SOYHLrjzK2X1ezoPC6cr", // Harry - Fierce Warrior (boisterous, punchy)
  elon: "iP95p4xoKVk53GoZ742B", // Chris - Down-to-Earth (monotone, dry)
  gates: "bIHbv24MWmeRgasZH58o", // Will - Relaxed Optimist (nerdy enthusiasm)

  // TECHNICAL
  daftpunk: "GFj5Qf6cNQ3Lgp8VKBwc", // Olivier D (French! + we'll vocoder post-process)
  zoltan: "N92AkbZOhisWQdaHTKFC", // zoltan (custom cloned voice!)
  einstein: "JBFqnCBsd6RMkjVDRZzb", // George - Warm (gentle, wonder)
  erdos: "TX3LPaxmHKxFdv7VOQHJ", // Liam - Energetic (quick, mathematician energy)
  rubik: "SAz9YHcvj6GT2YYXdXww", // River - Neutral (synthesized feel)
  arnold: "bIHbv24MWmeRgasZH58o", // Will - Relaxed Optimist (enthusiastic)
  peti: "onwK4e9ZLuTAKqWW03F9", // Daniel - Steady (deadpan energy)
  attila: "pNInz6obpgDQGcFmaJgB", // Adam - Dominant (deep, Magyar gravitas)
  switchboard: "jRAAK67SEFE9m7ci5DhD", // Ollie - British (dry wit)
  gp: "cjVigY5qzO86Huf0OWal", // Eric - Smooth (builder confidence)
  raju: "IKne3meq5aSn9XLyUdCD", // Charlie - Deep, Confident (steady)

  // QA RAPID FIRE — maximize variety
  "alex-chen": "TX3LPaxmHKxFdv7VOQHJ", // Liam - Energetic (male, American)
  "priya-sharma": "FGY2WhTYpPnrIDTdsKH5", // Laura - Enthusiast (female)
  "marcus-johnson": "IKne3meq5aSn9XLyUdCD", // Charlie - Deep (male)
  "sofia-rodriguez": "cgSgspJ2msm6clMCkdW9", // Jessica - Playful (female, Latin)
  "yuki-tanaka": "hpp4J3VqNfWAUOO0d1Us", // Bella - Professional (female)
  "ahmed-hassan": "CwhRBWXzGAHq8TQ4Fs17", // Roger - Laid-Back (male)
  "carlos-mendez": "SOYHLrjzK2X1ezoPC6cr", // Harry - Fierce (male, energetic)
  "lisa-park": "XrExE9yKIg1WjnnlVkGX", // Matilda - Professional (female)
  "david-brown": "enQe6GkCdIQISiSaM4lg", // British Male Young
  "anya-ivanova": "EXAVITQu4vr4xnSDxMaL", // Sarah - Mature (female)
  "tom-obrien": "jRAAK67SEFE9m7ci5DhD", // Ollie - British (male, Irish-ish)
  "mei-lin-wu": "pFZP5JQG7iQjIQuC4Bku", // Lily - Velvety (female)
  "james-cooper": "nPczCjzI2devNBz1zQrb", // Brian - Deep (male)
  "rachel-kim": "Xb7hH8MSUJpSbSDYk0k2", // Alice - Clear (female)
  "oleg-petrov": "N2lVS1w4EtoT3dr4eOWO", // Callum - Husky (male)

  // CROWD
  "crowd-01": "FGY2WhTYpPnrIDTdsKH5", // Laura (female, upbeat)
  "crowd-02": "JBFqnCBsd6RMkjVDRZzb", // George (male, warm)
  "crowd-03": "TX3LPaxmHKxFdv7VOQHJ", // Liam (male, energetic)
  "crowd-04": "cgSgspJ2msm6clMCkdW9", // Jessica (female, gentle)
  "crowd-05": "iP95p4xoKVk53GoZ742B", // Chris (male, thoughtful)
  "crowd-06": "hpp4J3VqNfWAUOO0d1Us", // Bella (female, sincere)
  "crowd-07": "pNInz6obpgDQGcFmaJgB", // Adam (male, firm kind)
};

// ── Persona lines from elvis-constants.ts ─────────────────────────────────

const PERSONA_LINES: Record<string, string> = {
  "host-a": "So we got this document... it's not a paper. It's a person.",
  "host-b":
    "Elvis. He speaks French. He doesn't say much in English. But you know when someone walks in and the room gets better? That's Elvis. And he drums. Like, REALLY drums.",
  socrates:
    "Elvis, I have spent my life asking questions no one wants to answer. But your drums? They ask questions everyone feels.",
  diogenes:
    "They told me to find an honest man. I found an honest drummer instead. You don't pretend, Elvis. That's rare.",
  plato:
    "In my cave allegory, people watched shadows. But you, Elvis — you make the shadows dance.",
  aristotle:
    "Rhythm is the golden mean between silence and chaos. You found it, Elvis. You live in it.",
  nietzsche:
    "Without music, life would be a mistake. Elvis, your drumming is proof that life is not a mistake.",
  kant: "I wrote about duty and reason. But the purest duty is being exactly who you are. You do that, Elvis.",
  "marcus-aurelius":
    "The universe is change. Our life is what our thoughts make it. Your thoughts are rhythm, Elvis. That is a good life.",
  wittgenstein:
    "Whereof one cannot speak, thereof one must be silent. Or drum. Drumming works too.",
  buddha:
    "Be present. That is all. When you drum, Elvis, you are the most present person in the room.",
  camus:
    "Il faut imaginer Sisyphe heureux. Elvis, il faut imaginer le batteur heureux. Et tu l'es.",
  simone: "On ne nait pas libre, on le devient. Elvis, quand tu joues, tu es libre.",
  arendt:
    "The most radical thing you can do is begin something new. Every time you pick up those sticks, you begin.",
  trump:
    "Elvis, let me tell you — tremendous drummer. The best. People are saying it. Believe me, nobody drums like Elvis.",
  elon: "First principles: rhythm is physics. Vibration at frequency. Elvis has optimized for the fundamental frequency of being human.",
  gates:
    "The data shows that music therapy improves outcomes by 47%. But Elvis doesn't need data. He IS the data.",
  daftpunk:
    "Around the world, around the world. Elvis, le rythme n'a pas de frontieres. On t'aime.",
  zoltan:
    "Elvis, I'm in the same ward as you. I can't drum. But I can build things. So I built this. For you.",
  einstein:
    "Imagination is more important than knowledge. Elvis, your imagination speaks through your hands.",
  erdos: "Another roof, another proof. Another beat, another proof of life. Keep proving, Elvis.",
  rubik:
    "Every problem has a solution. Every rhythm has a pattern. Elvis, you solve the puzzle every time you play.",
  arnold:
    "Design is not just what it looks like. Design is how it works. Elvis, your drumming works beautifully.",
  peti: "I've tested a lot of things. Most of them are broken. But your rhythm, Elvis? QA approved.",
  attila:
    "A true Magyar knows that strength is not loudness. It is persistence. Keep drumming, Elvis.",
  switchboard:
    "I've compared every option. Best drummer in the ward: Elvis. Five stars. No contest.",
  gp: "No code needed. No framework required. Just hands and rhythm. Elvis, you ship every single day.",
  raju: "Elvis, you are the load-bearing beam of this place. The infrastructure runs because you drum.",
  "alex-chen": "Your rhythm is flawless, Elvis.",
  "priya-sharma": "Every beat lands exactly where it should.",
  "marcus-johnson": "You make it look easy, man.",
  "sofia-rodriguez": "El ritmo esta en tu sangre, Elvis.",
  "yuki-tanaka": "Your drumming is like water. It flows.",
  "ahmed-hassan": "Brother, your hands speak louder than words.",
  "carlos-mendez": "Musica es vida, Elvis. Music is life.",
  "lisa-park": "Keep that energy going, Elvis!",
  "david-brown": "Mate, you've got the gift.",
  "anya-ivanova": "Your rhythm has soul, Elvis.",
  "tom-obrien": "Pure class on the drums, lad.",
  "mei-lin-wu": "You drum with your whole heart.",
  "james-cooper": "That groove is unstoppable.",
  "rachel-kim": "Elvis, you light up this place.",
  "oleg-petrov": "Respect, Elvis. Real respect.",
  "crowd-01": "We see you, Elvis.",
  "crowd-02": "We hear you.",
  "crowd-03": "We feel the beat.",
  "crowd-04": "You don't need to speak.",
  "crowd-05": "The drums say everything.",
  "crowd-06": "You're one of us.",
  "crowd-07": "Stay exactly who you are.",
};

// ── ElevenLabs TTS API ────────────────────────────────────────────────────

const API_BASE = "https://api.elevenlabs.io/v1";

interface TtsOptions {
  voiceId: string;
  text: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
}

async function generateTts(opts: TtsOptions): Promise<ArrayBuffer> {
  const response = await fetch(`${API_BASE}/text-to-speech/${opts.voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": API_KEY!,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: opts.text,
      model_id: opts.modelId ?? "eleven_multilingual_v2",
      voice_settings: {
        stability: opts.stability ?? 0.5,
        similarity_boost: opts.similarityBoost ?? 0.75,
        style: opts.style ?? 0.0,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error ${response.status}: ${errorText}`);
  }

  return response.arrayBuffer();
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  await mkdir(AUDIO_DIR, { recursive: true });

  const personaIds = Object.keys(PERSONA_LINES);
  const total = personaIds.length;
  let completed = 0;
  let failed = 0;
  const errors: string[] = [];

  console.log(`\n🎤 Generating ${total} voice clips for Elvis Emotion\n`);
  console.log(`Output: ${AUDIO_DIR}\n`);

  // Process sequentially to respect rate limits
  for (const id of personaIds) {
    const voiceId = VOICE_MAP[id];
    const text = PERSONA_LINES[id];
    const outFile = path.join(AUDIO_DIR, `elvis-voice-${id}.mp3`);

    if (!voiceId) {
      console.log(`  ⚠ No voice mapped for "${id}" — skipping`);
      failed++;
      errors.push(`${id}: no voice mapped`);
      continue;
    }

    if (existsSync(outFile)) {
      console.log(`  ✓ ${id} — already exists, skipping`);
      completed++;
      continue;
    }

    try {
      process.stdout.write(`  ⏳ ${id} (${completed + 1}/${total})...`);

      // Use higher stability for philosophers/hosts, lower for energetic personas
      const isPhilosopher = [
        "socrates",
        "diogenes",
        "plato",
        "aristotle",
        "nietzsche",
        "kant",
        "marcus-aurelius",
        "wittgenstein",
        "buddha",
        "camus",
        "simone",
        "arendt",
      ].includes(id);
      const isHost = id.startsWith("host-");
      const isCrowd = id.startsWith("crowd-");

      const stability = isHost ? 0.6 : isPhilosopher ? 0.55 : isCrowd ? 0.4 : 0.45;
      const style = isHost ? 0.1 : isPhilosopher ? 0.15 : isCrowd ? 0.3 : 0.2;

      const audioBuffer = await generateTts({
        voiceId,
        text,
        stability,
        similarityBoost: 0.75,
        style,
      });

      await writeFile(outFile, Buffer.from(audioBuffer));
      const sizeMb = (audioBuffer.byteLength / 1024 / 1024).toFixed(2);
      console.log(` ✅ (${sizeMb} MB)`);
      completed++;

      // Small delay to avoid rate limits (free: 3 req/s, pro: higher)
      await new Promise((r) => setTimeout(r, 500));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(` ❌ ${msg}`);
      failed++;
      errors.push(`${id}: ${msg}`);
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`✅ Completed: ${completed}/${total}`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed}`);
    for (const e of errors) console.log(`   - ${e}`);
  }

  // Check character usage
  try {
    const userResp = await fetch(`${API_BASE}/user`, {
      headers: { "xi-api-key": API_KEY! },
    });
    const userData = (await userResp.json()) as {
      subscription?: { character_count?: number; character_limit?: number };
    };
    const sub = userData.subscription;
    if (sub) {
      console.log(
        `\n📊 Character usage: ${sub.character_count?.toLocaleString()} / ${sub.character_limit?.toLocaleString()}`,
      );
    }
  } catch {
    // ignore
  }

  console.log();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
