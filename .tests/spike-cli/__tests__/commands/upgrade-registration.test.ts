/**
 * Tests for commands/upgrade.ts — registerUpgradeCommand
 *
 * The file is 14% covered. The action handler calls installGlobalSpikeCli which
 * runs npm install; we test registration only and mock that dependency for
 * the action handler path.
 */

import { describe, expect, it, vi } from "vitest";
import { Command } from "commander";
import { registerUpgradeCommand } from "../../../../src/cli/spike-cli/core-logic/commands/upgrade.js";

// ── Registration structure ────────────────────────────────────────────────────

describe("registerUpgradeCommand — command structure", () => {
  it("registers 'upgrade' sub-command", () => {
    const program = new Command();
    registerUpgradeCommand(program);
    const cmd = program.commands.find((c) => c.name() === "upgrade");
    expect(cmd).toBeDefined();
  });

  it("registers --version option", () => {
    const program = new Command();
    registerUpgradeCommand(program);
    const cmd = program.commands.find((c) => c.name() === "upgrade")!;
    const flags = cmd.options.map((o) => o.flags);
    expect(flags.some((f) => f.includes("--version"))).toBe(true);
  });

  it("has a meaningful description", () => {
    const program = new Command();
    registerUpgradeCommand(program);
    const cmd = program.commands.find((c) => c.name() === "upgrade")!;
    expect(cmd.description().toLowerCase()).toContain("upgrade");
  });
});

// ── Action handler: delegates to installGlobalSpikeCli ────────────────────────

vi.mock("../../../../src/cli/spike-cli/core-logic/terminal/upgrade.js", () => ({
  installGlobalSpikeCli: vi.fn(),
  getPackageSpec: vi.fn().mockReturnValue("@spike-land-ai/spike-cli@latest"),
}));

describe("registerUpgradeCommand — action handler", () => {
  it("logs upgrade result when installGlobalSpikeCli resolves", async () => {
    const { installGlobalSpikeCli } = await import(
      "../../../../src/cli/spike-cli/core-logic/terminal/upgrade.js"
    );
    vi.mocked(installGlobalSpikeCli).mockResolvedValueOnce({
      beforeVersion: "0.1.0",
      afterVersion: "0.2.0",
      packageSpec: "@spike-land-ai/spike-cli@0.2.0",
    });

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const program = new Command();
    program.exitOverride();
    registerUpgradeCommand(program);

    // Manually invoke the action handler via parseAsync with fake argv
    Object.defineProperty(process, "argv", {
      value: ["node", "spike", "upgrade"],
      writable: true,
    });

    await program.parseAsync(["node", "spike", "upgrade"]);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("0.2.0"));
    logSpy.mockRestore();
  });

  it("propagates errors from installGlobalSpikeCli", async () => {
    const { installGlobalSpikeCli } = await import(
      "../../../../src/cli/spike-cli/core-logic/terminal/upgrade.js"
    );
    vi.mocked(installGlobalSpikeCli).mockRejectedValueOnce(
      new Error("npm error: permission denied"),
    );

    const program = new Command();
    program.exitOverride();
    registerUpgradeCommand(program);

    await expect(program.parseAsync(["node", "spike", "upgrade"])).rejects.toThrow(
      /permission denied/,
    );
  });
});
