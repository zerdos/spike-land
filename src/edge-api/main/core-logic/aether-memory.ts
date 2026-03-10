import type { AetherNote } from "./aether-prompt.js";

const DEMOTE_THRESHOLD = 0.3;
const PROMOTE_THRESHOLD = 0.6;
const PROMOTE_HELP_MIN = 3;
const MAX_DYNAMIC_TOKENS = 800;
const AVG_CHARS_PER_TOKEN = 4;
const MAX_DYNAMIC_CHARS = MAX_DYNAMIC_TOKENS * AVG_CHARS_PER_TOKEN;

/**
 * Select the most relevant notes that fit within the token budget.
 * Sorted by confidence × recency, packed greedily.
 */
export function selectNotes(notes: AetherNote[], maxTokens = MAX_DYNAMIC_TOKENS): AetherNote[] {
  const maxChars = maxTokens * AVG_CHARS_PER_TOKEN;
  const now = Date.now();

  const scored = notes
    .filter((n) => n.confidence >= DEMOTE_THRESHOLD)
    .map((n) => {
      const daysSinceUsed = (now - n.lastUsedAt) / (1000 * 60 * 60 * 24);
      const recencyFactor = 1 / (1 + daysSinceUsed * 0.1);
      return { note: n, score: n.confidence * recencyFactor };
    })
    .sort((a, b) => b.score - a.score);

  const selected: AetherNote[] = [];
  let charBudget = maxChars;

  for (const { note } of scored) {
    const noteChars = note.trigger.length + note.lesson.length + 30; // overhead
    if (noteChars > charBudget) continue;
    selected.push(note);
    charBudget -= noteChars;
  }

  return selected;
}

/**
 * Update note confidence using a simple Bayesian-inspired rule.
 * If the note helped: confidence moves toward 1.
 * If not: confidence moves toward 0.
 */
export function updateNoteConfidence(note: AetherNote, helped: boolean): AetherNote {
  const alpha = helped ? 0.15 : -0.1;
  const newConfidence = Math.max(0, Math.min(1, note.confidence + alpha));
  const newHelpCount = helped ? note.helpCount + 1 : note.helpCount;

  // Promote high-performing notes
  const promoted =
    newConfidence >= PROMOTE_THRESHOLD && newHelpCount >= PROMOTE_HELP_MIN
      ? Math.min(1, newConfidence + 0.05)
      : newConfidence;

  return {
    ...note,
    confidence: promoted,
    helpCount: newHelpCount,
    lastUsedAt: Date.now(),
  };
}

/**
 * Prune notes below the demote threshold. Returns only surviving notes.
 */
export function pruneNotes(notes: AetherNote[]): AetherNote[] {
  return notes.filter((n) => n.confidence >= DEMOTE_THRESHOLD);
}

/**
 * Try to extract a note from a user/assistant exchange.
 * Returns null if extraction fails or response is "null".
 */
export function parseExtractedNote(
  rawResponse: string,
): Pick<AetherNote, "trigger" | "lesson" | "confidence"> | null {
  const trimmed = rawResponse.trim();
  if (trimmed === "null" || !trimmed.startsWith("{")) return null;

  try {
    const parsed = JSON.parse(trimmed) as {
      trigger?: string;
      lesson?: string;
      confidence?: number;
    };
    if (!parsed.trigger || !parsed.lesson || typeof parsed.confidence !== "number") {
      return null;
    }
    return {
      trigger: parsed.trigger,
      lesson: parsed.lesson,
      confidence: Math.max(0.3, Math.min(0.7, parsed.confidence)),
    };
  } catch {
    return null;
  }
}

/**
 * Fetch all notes for a user from D1.
 */
export async function fetchUserNotes(db: D1Database, userId: string): Promise<AetherNote[]> {
  const result = await db
    .prepare(
      "SELECT id, user_id, trigger_text, lesson, confidence, help_count, created_at, last_used_at FROM aether_notes WHERE user_id = ? ORDER BY confidence DESC",
    )
    .bind(userId)
    .all<{
      id: string;
      user_id: string;
      trigger_text: string;
      lesson: string;
      confidence: number;
      help_count: number;
      created_at: number;
      last_used_at: number;
    }>();

  return (result.results ?? []).map((row) => ({
    id: row.id,
    trigger: row.trigger_text,
    lesson: row.lesson,
    confidence: row.confidence,
    helpCount: row.help_count,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
  }));
}

/**
 * Upsert a note into D1.
 */
export async function saveNote(db: D1Database, userId: string, note: AetherNote): Promise<void> {
  await db
    .prepare(
      `INSERT INTO aether_notes (id, user_id, trigger_text, lesson, confidence, help_count, created_at, last_used_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         confidence = excluded.confidence,
         help_count = excluded.help_count,
         last_used_at = excluded.last_used_at`,
    )
    .bind(
      note.id,
      userId,
      note.trigger,
      note.lesson,
      note.confidence,
      note.helpCount,
      note.createdAt,
      note.lastUsedAt,
    )
    .run();
}

/**
 * Delete notes below demote threshold from D1.
 */
export async function pruneNotesInDb(db: D1Database, userId: string): Promise<void> {
  await db
    .prepare("DELETE FROM aether_notes WHERE user_id = ? AND confidence < ?")
    .bind(userId, DEMOTE_THRESHOLD)
    .run();
}

export { MAX_DYNAMIC_CHARS, DEMOTE_THRESHOLD };
