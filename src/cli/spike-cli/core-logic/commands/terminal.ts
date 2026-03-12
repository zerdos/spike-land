import { randomUUID } from "node:crypto";
import type { Command } from "commander";
import { collect, parseInlineServers, parseInlineUrls } from "./common";
import { runTerminalWorkerProcess } from "../terminal/worker";
import { TerminalSupervisor } from "../terminal/supervisor";

interface TerminalCommandOptions {
  config?: string | undefined;
  server: string[];
  serverUrl: string[];
  model?: string | undefined;
  session?: string | undefined;
  resume?: boolean | undefined;
  maxTurns?: string | undefined;
}

export function registerTerminalCommand(program: Command): void {
  program
    .command("terminal")
    .alias("code")
    .description("Repo-aware interactive coding agent")
    .option("--config <path>", "Path to .mcp.json config file")
    .option("--server <name=command>", "Add an inline stdio server", collect, [])
    .option("--server-url <name=url>", "Add an inline URL server", collect, [])
    .option("--model <model>", "Model to use for agent turns", "claude-sonnet-4-6")
    .option("--session <id>", "Resume or create a named terminal session")
    .option("--resume", "Resume an existing terminal session if present")
    .option("--max-turns <count>", "Maximum agent loop turns per user input", "20")
    .action(async (options: TerminalCommandOptions) => {
      const supervisor = new TerminalSupervisor({
        sessionId: options.session ?? randomUUID(),
        cwd: process.cwd(),
        baseUrl: String(program.opts()["baseUrl"] ?? "https://spike.land"),
        entrypoint: process.argv[1] ?? "",
        ...(options.model ? { model: options.model } : {}),
        ...(options.config ? { configPath: options.config } : {}),
        inlineServers: parseInlineServers(options.server),
        inlineUrls: parseInlineUrls(options.serverUrl),
        maxTurns: Number.parseInt(options.maxTurns ?? "20", 10) || 20,
        resume: !!options.resume || !!options.session,
      });

      await supervisor.start();
    });

  program
    .command("terminal-worker")
    .description("Internal spike terminal worker")
    .action(async () => {
      await runTerminalWorkerProcess();
    });
}
