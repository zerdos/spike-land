import { Hono } from "hono";

import type { Env, Variables } from "../../core-logic/env";

const classify = new Hono<{ Bindings: Env; Variables: Variables }>();

const ALLOWED_TYPES = new Set([
  "general",
  "claim",
  "question",
  "idea",
  "task",
  "entity",
  "quote",
  "reference",
  "definition",
  "opinion",
  "reflection",
  "narrative",
  "comparison",
  "thesis",
]);

const SYSTEM_PROMPT = `You are a note classifier. Read one short note and output a JSON object describing what kind of note it is.

Allowed types (pick the best one, lowercase):
- claim: an assertion presented as true
- question: phrased as or functions as a question
- idea: a proposal, hypothesis, or brainstorm
- task: an action item or todo
- entity: names a person, place, org, or product
- quote: a verbatim quotation
- reference: a citation, link, or source
- definition: defines a term
- opinion: a personal take or judgment
- reflection: introspective or retrospective
- narrative: a story beat or anecdote
- comparison: contrasts two or more things
- thesis: the main argument of a larger piece
- general: none of the above

Return strict JSON: {"type": "<one of the types>", "confidence": <0..1 number>}. No prose, no markdown fences.`;

function safeParseJson(text: string): { type?: string; confidence?: number } | null {
  if (!text) return null;
  const trimmed = text.trim();
  // Strip ```json fences if present
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const body = fenced ? fenced[1]! : trimmed;
  try {
    return JSON.parse(body) as { type?: string; confidence?: number };
  } catch {
    // Attempt to find the first JSON object in the text
    const m = body.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]) as { type?: string; confidence?: number };
    } catch {
      return null;
    }
  }
}

classify.post("/api/notes/:id/classify", async (c) => {
  const id = c.req.param("id");

  const note = await c.env.DB.prepare("SELECT * FROM notes WHERE id = ?").bind(id).first<{
    id: string;
    content: string;
    type: string;
  }>();
  if (!note) return c.json({ error: "Note not found" }, 404);

  const text = (note.content || "").trim();
  if (text.length < 3) {
    return c.json({ id, type: note.type, confidence: 0, skipped: "too-short" });
  }

  if (!c.env.AI) {
    return c.json({ error: "AI binding not configured" }, 503);
  }

  let classified: { type?: string; confidence?: number } | null = null;
  try {
    const response = (await c.env.AI.run(
      "@cf/meta/llama-3.1-8b-instruct" as never,
      {
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text.slice(0, 800) },
        ],
        max_tokens: 80,
        temperature: 0.1,
      } as never,
    )) as { response?: string };
    classified = safeParseJson(response?.response ?? "");
  } catch (err) {
    return c.json({ error: "AI call failed", detail: String(err) }, 502);
  }

  const pickedType =
    classified?.type && ALLOWED_TYPES.has(classified.type) ? classified.type : "general";
  const confidence =
    typeof classified?.confidence === "number"
      ? Math.max(0, Math.min(1, classified.confidence))
      : 0.5;

  const now = Date.now();
  await c.env.DB.prepare("UPDATE notes SET type = ?, confidence = ?, updated_at = ? WHERE id = ?")
    .bind(pickedType, confidence, now, id)
    .run();

  return c.json({ id, type: pickedType, confidence });
});

export { classify };
