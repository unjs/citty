import consola from "consola";
import type { ArgsDef, CommandDef } from "./types";
import { resolveSubCommand, runCommand } from "./command";
import { CLIError } from "./_utils";
import { showUsage } from "./usage";

export interface RunMainOptions {
  rawArgs?: string[];
}

export async function runMain<T extends ArgsDef = ArgsDef>(
  cmd: CommandDef<T>,
  opts: RunMainOptions = {},
) {
  const rawArgs = opts.rawArgs || process.argv.slice(2);
  try {
    if (rawArgs.includes("--help") || rawArgs.includes("-h")) {
      await showUsage(...(await resolveSubCommand(cmd, rawArgs)));
      process.exit(0);
    } else if (rawArgs.includes("--version") || rawArgs.includes("-v")) {
      const meta = typeof cmd.meta === "function" ? (await cmd.meta()) : await cmd.meta;

      if (!meta) {
        throw new CLIError("No meta specified", "E_NO_META");
      }

      if (!meta?.version) {
        throw new CLIError("No version specified", "E_NO_VERSION");
      }

      consola.info(meta.version);
    } else {
      await runCommand(cmd, { rawArgs });
    }
  } catch (error: any) {
    const isCLIError = error instanceof CLIError;
    if (!isCLIError) {
      consola.error(error, "\n");
    }
    if (isCLIError) {
      await showUsage(...(await resolveSubCommand(cmd, rawArgs)));
    }
    consola.error(error.message);
    process.exit(1);
  }
}
