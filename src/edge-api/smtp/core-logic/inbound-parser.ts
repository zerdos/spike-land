export interface ParsedHeaders {
  messageId: string | null;
  subject: string | null;
  from: string | null;
  to: string | null;
  date: string | null;
  inReplyTo: string | null;
}

export function parseHeaders(raw: string): ParsedHeaders {
  const headerBlock = raw.split(/\r?\n\r?\n/, 1)[0] ?? "";
  const unfolded = headerBlock.replace(/\r?\n[ \t]+/g, " ");
  const lines = unfolded.split(/\r?\n/);
  const map = new Map<string, string>();
  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    const name = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (!map.has(name)) map.set(name, value);
  }
  return {
    messageId: map.get("message-id") ?? null,
    subject: map.get("subject") ?? null,
    from: map.get("from") ?? null,
    to: map.get("to") ?? null,
    date: map.get("date") ?? null,
    inReplyTo: map.get("in-reply-to") ?? null,
  };
}

export async function streamToString(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  // 5 MB cap — refuse anything bigger.
  const MAX = 5 * 1024 * 1024;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX) throw new Error("Message exceeds 5MB limit");
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8").decode(merged);
}
