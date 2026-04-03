/**
 * generate-blog-audio.ts — Pre-generate ElevenLabs TTS audio for blog posts.
 *
 * Extracts readable text from MDX, chunks it for the API, generates audio,
 * concatenates into a single MP3 per post, and saves to the public blog dir.
 *
 * Usage: node --import tsx scripts/generate-blog-audio.ts [slug-filter]
 * Example: node --import tsx scripts/generate-blog-audio.ts systems-thinking
 */
import { writeFile, mkdir, readFile, readdir, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("ELEVENLABS_API_KEY not set");
  process.exit(1);
}

const CONTENT_DIR = path.resolve(process.cwd(), "content/blog");
const PUBLIC_BLOG_DIR = path.resolve(process.cwd(), "packages/spike-web/public/blog");
const API_BASE = "https://api.elevenlabs.io/v1";

// Sarah — warm, clear, great for long-form reading
const VOICE_ID = "EXAVITQu4vr4xnSDxMaL";
const MODEL_ID = "eleven_multilingual_v2";
const MAX_CHARS_PER_CHUNK = 4500;

// ── MDX → plain text ─────────────────────────────────────────────────────

function stripFrontmatter(mdx: string): string {
  const match = mdx.match(/^---\n[\s\S]*?\n---\n/);
  return match ? mdx.slice(match[0].length) : mdx;
}

function mdxToPlainText(mdx: string): string {
  let text = stripFrontmatter(mdx);

  // Remove HTML/JSX tags
  text = text.replace(/<[^>]+>/g, "");
  // Remove markdown images
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "");
  // Convert markdown links to just text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  // Remove emphasis markers but keep text
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/\*([^*]+)\*/g, "$1");
  text = text.replace(/_([^_]+)_/g, "$1");
  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, "");
  text = text.replace(/`([^`]+)`/g, "$1");
  // Convert headers to plain text with a pause
  text = text.replace(/^#{1,6}\s+(.+)$/gm, "\n$1.\n");
  // Convert blockquotes
  text = text.replace(/^>\s*/gm, "");
  // Remove horizontal rules
  text = text.replace(/^---+$/gm, "");
  // Remove bullet markers
  text = text.replace(/^[-*]\s+/gm, "");
  // Collapse multiple newlines
  text = text.replace(/\n{3,}/g, "\n\n");
  // Trim
  text = text.trim();

  return text;
}

// ── Chunking ──────────────────────────────────────────────────────────────

interface TextChunk {
  index: number;
  text: string;
}

function chunkText(text: string): TextChunk[] {
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  const chunks: TextChunk[] = [];
  let current = "";
  let index = 0;

  for (const para of paragraphs) {
    if (current.length + para.length + 2 > MAX_CHARS_PER_CHUNK && current.length > 0) {
      chunks.push({ index: index++, text: current.trim() });
      current = "";
    }
    current += (current ? "\n\n" : "") + para;
  }
  if (current.trim()) {
    chunks.push({ index: index++, text: current.trim() });
  }

  return chunks;
}

// ── ElevenLabs TTS ────────────────────────────────────────────────────────

async function generateTts(text: string): Promise<ArrayBuffer> {
  const response = await fetch(`${API_BASE}/text-to-speech/${VOICE_ID}`, {
    method: "POST",
    headers: {
      "xi-api-key": API_KEY!,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: {
        stability: 0.58,
        similarity_boost: 0.75,
        style: 0.12,
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

// ── Process a single blog post ────────────────────────────────────────────

async function processPost(slug: string, mdxPath: string): Promise<void> {
  const outDir = path.join(PUBLIC_BLOG_DIR, slug);
  const outFile = path.join(outDir, "read-aloud.mp3");

  if (existsSync(outFile)) {
    const stats = await import("node:fs").then((fs) => fs.statSync(outFile));
    if (stats.size > 10000) {
      console.log(
        `  ✓ ${slug} — already exists (${(stats.size / 1024 / 1024).toFixed(2)} MB), skipping`,
      );
      return;
    }
  }

  const mdx = await readFile(mdxPath, "utf-8");
  const plainText = mdxToPlainText(mdx);
  const chunks = chunkText(plainText);

  console.log(`  Processing ${slug}: ${plainText.length} chars, ${chunks.length} chunks`);

  await mkdir(outDir, { recursive: true });

  const tmpDir = path.join(outDir, "_tmp_audio");
  await mkdir(tmpDir, { recursive: true });

  // Generate audio for each chunk
  const chunkFiles: string[] = [];
  for (const chunk of chunks) {
    const chunkFile = path.join(tmpDir, `chunk-${String(chunk.index).padStart(3, "0")}.mp3`);
    chunkFiles.push(chunkFile);

    if (existsSync(chunkFile)) {
      process.stdout.write(`    chunk ${chunk.index + 1}/${chunks.length} (cached) `);
      continue;
    }

    process.stdout.write(
      `    chunk ${chunk.index + 1}/${chunks.length} (${chunk.text.length} chars)...`,
    );

    const audioBuffer = await generateTts(chunk.text);
    await writeFile(chunkFile, Buffer.from(audioBuffer));
    const sizeMb = (audioBuffer.byteLength / 1024 / 1024).toFixed(2);
    console.log(` ✅ (${sizeMb} MB)`);

    // Rate limit delay
    await new Promise((r) => setTimeout(r, 600));
  }

  // Concatenate with ffmpeg
  console.log(`    Concatenating ${chunkFiles.length} chunks...`);
  const listFile = path.join(tmpDir, "filelist.txt");
  const fileListContent = chunkFiles.map((f) => `file '${f}'`).join("\n");
  await writeFile(listFile, fileListContent);

  try {
    execSync(`ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${outFile}" 2>/dev/null`, {
      stdio: "pipe",
    });

    const finalSize = await import("node:fs").then((fs) => fs.statSync(outFile).size);
    console.log(`    ✅ ${slug}/read-aloud.mp3 (${(finalSize / 1024 / 1024).toFixed(2)} MB)`);
  } catch (err) {
    console.error(`    ❌ ffmpeg concat failed:`, err);
  }

  // Clean up temp files
  for (const f of chunkFiles) {
    await unlink(f).catch(() => {});
  }
  await unlink(listFile).catch(() => {});
  await import("node:fs")
    .then((fs) => fs.rmdirSync(tmpDir, { recursive: false } as never))
    .catch(() => {});
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const filter = process.argv[2] || "";
  const files = await readdir(CONTENT_DIR);
  const mdxFiles = files
    .filter((f) => f.endsWith(".mdx"))
    .filter((f) => !filter || f.includes(filter))
    .sort();

  console.log(`\n🎙️ Generating read-aloud audio for ${mdxFiles.length} blog posts\n`);

  for (const file of mdxFiles) {
    const slug = file.replace(/\.mdx$/, "");
    const mdxPath = path.join(CONTENT_DIR, file);
    await processPost(slug, mdxPath);
    console.log();
  }

  // Character usage
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
        `📊 Character usage: ${sub.character_count?.toLocaleString()} / ${sub.character_limit?.toLocaleString()}`,
      );
    }
  } catch {
    // ignore
  }

  console.log("Done!\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
