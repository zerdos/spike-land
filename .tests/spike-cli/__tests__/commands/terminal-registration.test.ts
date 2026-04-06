/**
 * Tests for commands/terminal.ts — registerTerminalCommand
 *
 * The file is 40% covered. The action handlers spawn child processes so we
 * only test command registration and option structure here.
 */

import { describe, expect, it } from "vitest";
import { Command } from "commander";
import { registerTerminalCommand } from "../../../../src/cli/spike-cli/core-logic/commands/terminal.js";

describe("registerTerminalCommand", () => {
  it("registers 'terminal' sub-command", () => {
    const program = new Command();
    registerTerminalCommand(program);
    const cmd = program.commands.find((c) => c.name() === "terminal");
    expect(cmd).toBeDefined();
  });

  it("registers 'terminal-worker' sub-command", () => {
    const program = new Command();
    registerTerminalCommand(program);
    const cmd = program.commands.find((c) => c.name() === "terminal-worker");
    expect(cmd).toBeDefined();
  });

  it("'terminal' has alias 'code'", () => {
    const program = new Command();
    registerTerminalCommand(program);
    const cmd = program.commands.find((c) => c.name() === "terminal");
    if (!cmd) throw new Error("terminal command not found");
    expect(cmd.aliases()).toContain("code");
  });

  it("registers expected options on 'terminal'", () => {
    const program = new Command();
    registerTerminalCommand(program);
    const cmd = program.commands.find((c) => c.name() === "terminal");
    if (!cmd) throw new Error("terminal command not found");
    const flags = cmd.options.map((o) => o.flags);
    expect(flags.some((f) => f.includes("--config"))).toBe(true);
    expect(flags.some((f) => f.includes("--model"))).toBe(true);
    expect(flags.some((f) => f.includes("--session"))).toBe(true);
    expect(flags.some((f) => f.includes("--resume"))).toBe(true);
    expect(flags.some((f) => f.includes("--max-turns"))).toBe(true);
  });

  it("'--model' defaults to claude-sonnet-4-6", () => {
    const program = new Command();
    registerTerminalCommand(program);
    const cmd = program.commands.find((c) => c.name() === "terminal");
    if (!cmd) throw new Error("terminal command not found");
    const modelOpt = cmd.options.find((o) => o.flags.includes("--model"));
    expect(modelOpt?.defaultValue).toBe("claude-sonnet-4-6");
  });

  it("'--max-turns' defaults to '20'", () => {
    const program = new Command();
    registerTerminalCommand(program);
    const cmd = program.commands.find((c) => c.name() === "terminal");
    if (!cmd) throw new Error("terminal command not found");
    const maxTurnsOpt = cmd.options.find((o) => o.flags.includes("--max-turns"));
    expect(maxTurnsOpt?.defaultValue).toBe("20");
  });

  it("'terminal-worker' has a description", () => {
    const program = new Command();
    registerTerminalCommand(program);
    const cmd = program.commands.find((c) => c.name() === "terminal-worker");
    if (!cmd) throw new Error("terminal-worker command not found");
    expect(cmd.description().length).toBeGreaterThan(0);
  });
});
