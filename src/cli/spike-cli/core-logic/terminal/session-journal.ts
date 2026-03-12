import { existsSync } from "node:fs";
import { appendFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { TerminalJournalEvent, TerminalSessionSnapshot } from "./types";

const SPIKE_HOME = join(homedir(), ".spike");
const SESSIONS_DIR = join(SPIKE_HOME, "sessions");
const OWNER_STALE_MS = 5 * 60 * 1000;

interface OwnershipRecord {
  ownerId: string;
  updatedAt: string;
}

export interface SessionJournalData {
  snapshot: TerminalSessionSnapshot | null;
  events: TerminalJournalEvent[];
}

export class SessionJournalStore {
  async claimOwnership(sessionId: string, ownerId: string): Promise<void> {
    const ownerPath = this.getOwnerPath(sessionId);
    await this.ensureSessionDir(sessionId);

    if (existsSync(ownerPath)) {
      const record = await this.readJson<OwnershipRecord>(ownerPath);
      if (record) {
        const ageMs = Date.now() - new Date(record.updatedAt).getTime();
        if (record.ownerId !== ownerId && ageMs < OWNER_STALE_MS) {
          throw new Error(`Session ${sessionId} is already owned by ${record.ownerId}`);
        }
      }
    }

    await writeFile(
      ownerPath,
      JSON.stringify(
        {
          ownerId,
          updatedAt: new Date().toISOString(),
        } satisfies OwnershipRecord,
        null,
        2,
      ),
      "utf-8",
    );
  }

  async refreshOwnership(sessionId: string, ownerId: string): Promise<void> {
    const ownerPath = this.getOwnerPath(sessionId);
    if (!existsSync(ownerPath)) return;

    const record = await this.readJson<OwnershipRecord>(ownerPath);
    if (!record || record.ownerId !== ownerId) return;

    await writeFile(
      ownerPath,
      JSON.stringify(
        { ownerId, updatedAt: new Date().toISOString() } satisfies OwnershipRecord,
        null,
        2,
      ),
      "utf-8",
    );
  }

  async releaseOwnership(sessionId: string, ownerId: string): Promise<void> {
    const ownerPath = this.getOwnerPath(sessionId);
    if (!existsSync(ownerPath)) return;

    const record = await this.readJson<OwnershipRecord>(ownerPath);
    if (record && record.ownerId !== ownerId) return;

    await rm(ownerPath, { force: true });
  }

  async writeSnapshot(snapshot: TerminalSessionSnapshot): Promise<void> {
    await this.ensureSessionDir(snapshot.sessionId);
    await writeFile(
      this.getSnapshotPath(snapshot.sessionId),
      JSON.stringify(snapshot, null, 2),
      "utf-8",
    );
  }

  async appendEvent(sessionId: string, event: TerminalJournalEvent): Promise<void> {
    await this.ensureSessionDir(sessionId);
    await appendFile(this.getJournalPath(sessionId), `${JSON.stringify(event)}\n`, "utf-8");
  }

  async load(sessionId: string): Promise<SessionJournalData> {
    await this.ensureSessionDir(sessionId);
    const snapshot = await this.readJson<TerminalSessionSnapshot>(this.getSnapshotPath(sessionId));
    const events = await this.readJournal(sessionId);
    return {
      snapshot: snapshot ?? null,
      events,
    };
  }

  getSessionDir(sessionId: string): string {
    return join(SESSIONS_DIR, sessionId);
  }

  private async ensureSessionDir(sessionId: string): Promise<void> {
    await mkdir(this.getSessionDir(sessionId), { recursive: true });
  }

  private getSnapshotPath(sessionId: string): string {
    return join(this.getSessionDir(sessionId), "snapshot.json");
  }

  private getJournalPath(sessionId: string): string {
    return join(this.getSessionDir(sessionId), "journal.jsonl");
  }

  private getOwnerPath(sessionId: string): string {
    return join(this.getSessionDir(sessionId), "owner.json");
  }

  private async readJournal(sessionId: string): Promise<TerminalJournalEvent[]> {
    const journalPath = this.getJournalPath(sessionId);
    if (!existsSync(journalPath)) return [];

    const content = await readFile(journalPath, "utf-8");
    return content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .flatMap((line) => {
        try {
          return [JSON.parse(line) as TerminalJournalEvent];
        } catch {
          return [];
        }
      });
  }

  private async readJson<T>(path: string): Promise<T | null> {
    if (!existsSync(path)) return null;

    try {
      const content = await readFile(path, "utf-8");
      return JSON.parse(content) as T;
    } catch {
      return null;
    }
  }
}
