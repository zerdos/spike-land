import { spawn } from "node:child_process";
import { platform } from "node:os";

export interface CommandExecutionResult {
  code: number;
  stdout: string;
  stderr: string;
}

export interface CommandRunner {
  run(command: string, args: string[]): Promise<CommandExecutionResult>;
}

class SpawnCommandRunner implements CommandRunner {
  run(command: string, args: string[]): Promise<CommandExecutionResult> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk: Buffer | string) => {
        stdout += String(chunk);
      });
      child.stderr.on("data", (chunk: Buffer | string) => {
        stderr += String(chunk);
      });
      child.on("error", reject);
      child.on("exit", (code) => {
        resolve({
          code: code ?? 1,
          stdout,
          stderr,
        });
      });
    });
  }
}

export interface UpgradeResult {
  beforeVersion: string;
  afterVersion: string;
  packageSpec: string;
}

export function getGlobalNpmCommand(): string {
  return platform() === "win32" ? "npm.cmd" : "npm";
}

export function getPackageSpec(versionSpec?: string): string {
  return `@spike-land-ai/spike-cli@${versionSpec?.trim() || "latest"}`;
}

export async function readCliVersion(
  entrypoint: string,
  runner: CommandRunner = new SpawnCommandRunner(),
): Promise<string> {
  const result = await runner.run(process.execPath, [entrypoint, "--version"]);
  if (result.code !== 0) {
    throw new Error(result.stderr.trim() || "Failed to read spike CLI version");
  }
  return result.stdout.trim();
}

export async function installGlobalSpikeCli(
  entrypoint: string,
  versionSpec?: string,
  runner: CommandRunner = new SpawnCommandRunner(),
): Promise<UpgradeResult> {
  const beforeVersion = await readCliVersion(entrypoint, runner);
  const packageSpec = getPackageSpec(versionSpec);
  const install = await runner.run(getGlobalNpmCommand(), ["install", "-g", packageSpec]);

  if (install.code !== 0) {
    throw new Error(install.stderr.trim() || `Global install failed for ${packageSpec}`);
  }

  const afterVersion = await readCliVersion(entrypoint, runner);
  if (!afterVersion) {
    throw new Error("Installed package did not produce a readable CLI version");
  }

  return {
    beforeVersion,
    afterVersion,
    packageSpec,
  };
}
