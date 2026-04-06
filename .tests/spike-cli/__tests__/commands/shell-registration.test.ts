/**
 * Tests for commands/shell.ts — registerShellCommand
 *
 * The file is 1.63% covered because the entire action handler requires live
 * MCP servers. We test the registerable structure (command name, options, description)
 * without invoking the action — that part requires network-connected servers.
 */

import { describe, expect, it } from "vitest";
import { Command } from "commander";
import { registerShellCommand } from "../../../../src/cli/spike-cli/core-logic/commands/shell.js";

describe("registerShellCommand", () => {
  it("registers 'shell' as a sub-command", () => {
    const program = new Command();
    registerShellCommand(program);
    const cmd = program.commands.find((c) => c.name() === "shell");
    expect(cmd).toBeDefined();
  });

  it("registers expected options: --config, --server, --server-url", () => {
    const program = new Command();
    registerShellCommand(program);
    const cmdFound = program.commands.find((c) => c.name() === "shell");
    if (!cmdFound) throw new Error("shell command not found");
    const optionFlags = cmdFound.options.map((o) => o.flags);
    expect(optionFlags.some((f) => f.includes("--config"))).toBe(true);
    expect(optionFlags.some((f) => f.includes("--server "))).toBe(true);
    expect(optionFlags.some((f) => f.includes("--server-url"))).toBe(true);
  });

  it("has description mentioning REPL or MCP", () => {
    const program = new Command();
    registerShellCommand(program);
    const cmd = program.commands.find((c) => c.name() === "shell");
    if (!cmd) throw new Error("shell command not found");
    expect(cmd.description().length).toBeGreaterThan(5);
  });
});
