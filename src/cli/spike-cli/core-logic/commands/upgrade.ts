import type { Command } from "commander";
import { installGlobalSpikeCli } from "../terminal/upgrade";

interface UpgradeCommandOptions {
  version?: string | undefined;
}

export function registerUpgradeCommand(program: Command): void {
  program
    .command("upgrade")
    .description("Upgrade the globally installed spike CLI")
    .option("--version <spec>", "Version or dist-tag to install")
    .action(async (options: UpgradeCommandOptions) => {
      const entrypoint = process.argv[1];
      if (!entrypoint) {
        throw new Error("Cannot resolve current CLI entrypoint for upgrade");
      }

      const result = await installGlobalSpikeCli(entrypoint, options.version);
      console.log(`Upgraded ${result.packageSpec}`);
      console.log(`Version: ${result.beforeVersion} -> ${result.afterVersion}`);
    });
}
