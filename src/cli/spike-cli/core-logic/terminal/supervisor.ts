import { spawn, type ChildProcess } from "node:child_process";
import * as readline from "node:readline";
import { randomUUID } from "node:crypto";
import { SessionJournalStore } from "./session-journal";
import { installGlobalSpikeCli } from "./upgrade";
import type {
  SupervisorToWorkerMessage,
  TerminalJournalEvent,
  TerminalSessionSnapshot,
  WorkerLaunchOptions,
  WorkerToSupervisorMessage,
} from "./types";

export interface TerminalSupervisorOptions extends WorkerLaunchOptions {
  entrypoint: string;
  resume?: boolean | undefined;
}

export class TerminalSupervisor {
  private readonly journalStore = new SessionJournalStore();
  private readonly ownerId = `supervisor-${process.pid}-${randomUUID()}`;
  private readonly options: TerminalSupervisorOptions;
  private child: ChildProcess | null = null;
  private rl: readline.Interface | null = null;
  private snapshot: TerminalSessionSnapshot | null = null;
  private busy = false;
  private shuttingDown = false;
  private ownershipHeartbeat: ReturnType<typeof setInterval> | null = null;
  private restartAttempts = 0;

  constructor(options: TerminalSupervisorOptions) {
    this.options = options;
  }

  async start(): Promise<void> {
    await this.journalStore.claimOwnership(this.options.sessionId, this.ownerId);
    this.ownershipHeartbeat = setInterval(() => {
      void this.journalStore.refreshOwnership(this.options.sessionId, this.ownerId);
    }, 60_000);

    if (this.options.resume) {
      const journal = await this.journalStore.load(this.options.sessionId);
      this.snapshot = journal.snapshot;
    }

    this.createReadline();
    await this.spawnWorker();
  }

  private createReadline(): void {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: "spike> ",
    });

    this.rl.on("line", (line) => {
      void this.handleUserLine(line);
    });
    this.rl.on("close", () => {
      void this.shutdown();
    });
  }

  private async handleUserLine(line: string): Promise<void> {
    const trimmed = line.trim();
    if (!trimmed) {
      this.prompt();
      return;
    }

    if (trimmed === "/quit" || trimmed === "/exit") {
      await this.shutdown();
      return;
    }

    if (trimmed.startsWith("/upgrade")) {
      const versionSpec = trimmed.split(/\s+/)[1];
      await this.performUpgrade(versionSpec);
      return;
    }

    if (this.busy) {
      console.error("Session is busy. Wait for the current turn to finish.");
      return;
    }

    this.busy = true;
    this.sendToWorker({
      type: "user_input",
      input: trimmed,
    });
  }

  private async spawnWorker(): Promise<void> {
    const child = spawn(process.execPath, [this.options.entrypoint, "terminal-worker"], {
      cwd: this.options.cwd,
      env: process.env,
      stdio: ["ignore", "ignore", "inherit", "ipc"],
    });

    child.on("message", (message: unknown) => {
      void this.handleWorkerMessage(message as WorkerToSupervisorMessage);
    });
    child.on("exit", (code, signal) => {
      void this.handleWorkerExit(code, signal);
    });

    this.child = child;
    this.sendToWorker({
      type: "init",
      options: {
        sessionId: this.options.sessionId,
        cwd: this.options.cwd,
        baseUrl: this.options.baseUrl,
        ...(this.options.model ? { model: this.options.model } : {}),
        ...(this.options.configPath ? { configPath: this.options.configPath } : {}),
        ...(this.options.inlineServers ? { inlineServers: this.options.inlineServers } : {}),
        ...(this.options.inlineUrls ? { inlineUrls: this.options.inlineUrls } : {}),
        ...(this.options.maxTurns ? { maxTurns: this.options.maxTurns } : {}),
      },
      snapshot: this.snapshot,
    });
  }

  private async handleWorkerMessage(message: WorkerToSupervisorMessage): Promise<void> {
    await this.recordEvent(message);

    switch (message.type) {
      case "child_ready":
        this.restartAttempts = 0;
        if (message.resumed) {
          console.error(`Restored session ${message.sessionId}`);
        } else {
          console.error(`Terminal agent ready in ${this.options.cwd}`);
        }
        return;
      case "child_restored":
        if (message.pendingTurn) {
          console.error(`Replaying in-flight turn ${message.pendingTurn.id}`);
        }
        return;
      case "checkpoint":
        this.snapshot = message.snapshot;
        await this.journalStore.writeSnapshot(message.snapshot);
        return;
      case "streamed_delta":
        process.stdout.write(message.text);
        return;
      case "tool_start":
        process.stderr.write(`\n[tool] ${message.toolCall.name}\n`);
        return;
      case "tool_end":
        process.stderr.write(
          `${message.toolCall.isError ? "[tool:error]" : "[tool:ok]"} ${message.toolCall.name}\n`,
        );
        return;
      case "status":
        console.error(message.message);
        return;
      case "input_ready":
        this.busy = message.busy;
        if (!message.busy) {
          this.prompt();
        }
        return;
      case "slash_output":
        if (message.text) {
          console.log(message.text);
        }
        if (message.exit) {
          await this.shutdown();
          return;
        }
        return;
      case "restart_requested":
        await this.performUpgrade(message.versionSpec);
        return;
      case "fatal_error":
        console.error(`Worker error: ${message.message}`);
        return;
    }
  }

  private async handleWorkerExit(
    code: number | null,
    signal: NodeJS.Signals | null,
  ): Promise<void> {
    if (this.shuttingDown) return;

    this.child = null;
    const interrupted =
      this.snapshot?.pendingTurn && this.snapshot.pendingTurn.status !== "completed";
    if (!interrupted || this.restartAttempts >= 3) {
      throw new Error(`Worker exited unexpectedly (${code ?? signal ?? "unknown"})`);
    }

    this.restartAttempts += 1;
    console.error(
      `Worker exited unexpectedly. Restarting from journal (${this.restartAttempts}/3)...`,
    );
    const journal = await this.journalStore.load(this.options.sessionId);
    this.snapshot = journal.snapshot;
    await this.spawnWorker();
  }

  private async performUpgrade(versionSpec?: string): Promise<void> {
    if (this.busy) {
      console.error("Cannot upgrade while a turn is in flight.");
      return;
    }

    if (this.snapshot) {
      await this.journalStore.writeSnapshot(this.snapshot);
    }

    console.error(`Installing ${versionSpec?.trim() || "latest"} spike-cli...`);
    const result = await installGlobalSpikeCli(this.options.entrypoint, versionSpec);
    console.error(`Upgraded spike-cli ${result.beforeVersion} -> ${result.afterVersion}`);

    if (this.child) {
      await this.stopWorker();
    }

    const journal = await this.journalStore.load(this.options.sessionId);
    this.snapshot = journal.snapshot;
    await this.spawnWorker();
  }

  private async stopWorker(): Promise<void> {
    if (!this.child) return;

    const child = this.child;
    this.child = null;
    child.send({ type: "shutdown" } satisfies SupervisorToWorkerMessage);

    await new Promise<void>((resolve) => {
      child.once("exit", () => resolve());
      setTimeout(() => {
        child.kill("SIGTERM");
        resolve();
      }, 2_000);
    });
  }

  private sendToWorker(message: SupervisorToWorkerMessage): void {
    this.child?.send(message);
  }

  private async recordEvent(message: WorkerToSupervisorMessage): Promise<void> {
    const event: TerminalJournalEvent = {
      type: message.type,
      timestamp: new Date().toISOString(),
      payload: message,
    };
    await this.journalStore.appendEvent(this.options.sessionId, event);
  }

  private prompt(): void {
    if (!this.rl || this.shuttingDown) return;
    this.rl.prompt();
  }

  async shutdown(): Promise<void> {
    if (this.shuttingDown) return;
    this.shuttingDown = true;

    if (this.ownershipHeartbeat) {
      clearInterval(this.ownershipHeartbeat);
      this.ownershipHeartbeat = null;
    }

    await this.stopWorker();
    await this.journalStore.releaseOwnership(this.options.sessionId, this.ownerId);
    this.rl?.close();
  }
}
