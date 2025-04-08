import consola from "consola";
import type { ArgsDef, CommandDef } from "./types";
import { extendCmd, resolveSubCommand, runCommand } from "./command";
import { CLIError } from "./_utils";
import { showUsage as _showUsage } from "./usage";

export interface RunMainOptions {
  rawArgs?: string[];
  showUsage?: typeof _showUsage;
}

export async function runMain<T extends ArgsDef = ArgsDef>(
  cmd: CommandDef<T>,
  opts: RunMainOptions = {},
) {
  const rawArgs = opts.rawArgs || process.argv.slice(2);
  const showUsage = opts.showUsage || _showUsage;

  try {
    await extendCmd(cmd, rawArgs, ["--help", "-h"], async (cmd, parent) => {
      await showUsage(cmd, parent);
      process.exit(0);
    });

    await extendCmd(cmd, rawArgs, ["--version", "-v"], async (cmd) => {
      const meta =
        typeof cmd.meta === "function" ? await cmd.meta() : await cmd.meta;
      if (!meta?.version) {
        throw new CLIError("No version specified", "E_NO_VERSION");
      }
      consola.log(meta.version);
      process.exit(0);
    });

    await runCommand(cmd, { rawArgs });
  } catch (error: any) {
    const isCLIError = error instanceof CLIError;
    if (isCLIError) {
      await showUsage(...(await resolveSubCommand(cmd, rawArgs)));
      consola.error(error.message);
    } else {
      consola.error(error, "\n");
    }
    process.exit(1);
  }
}

export function createMain<T extends ArgsDef = ArgsDef>(
  cmd: CommandDef<T>,
): (opts?: RunMainOptions) => Promise<void> {
  return (opts: RunMainOptions = {}) => runMain(cmd, opts);
}
