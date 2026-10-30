import type { ArgsDef, CommandDef } from "./types.ts";
import { resolveSubCommand, runCommand } from "./command.ts";
import { CLIError } from "./_utils.ts";
import { resolveBuiltinFlags, showUsage as _showUsage, type RenderUsageOptions } from "./usage.ts";

export interface RunMainOptions {
  rawArgs?: string[];
  showUsage?: typeof _showUsage;
  /**
   * Include built-in `--help`/`-h` and `--version`/`-v` in usage output.
   * @default true
   */
  showBuiltinFlags?: boolean;
}

export async function runMain<T extends ArgsDef = ArgsDef>(
  cmd: CommandDef<T>,
  opts: RunMainOptions = {},
) {
  const rawArgs = opts.rawArgs || process.argv.slice(2);
  const showBuiltinFlags = opts.showBuiltinFlags !== false;
  const usageOpts: RenderUsageOptions = { showBuiltinFlags };
  const showUsage = opts.showUsage || ((c, parent) => _showUsage(c, parent, usageOpts));
  try {
    const builtinFlags = await resolveBuiltinFlags(cmd);
    if (builtinFlags.help.length > 0 && rawArgs.some((arg) => builtinFlags.help.includes(arg))) {
      await showUsage(...(await resolveSubCommand(cmd, rawArgs)));
      process.exit(0);
    } else if (rawArgs.length === 1 && builtinFlags.version.includes(rawArgs[0]!)) {
      const meta = typeof cmd.meta === "function" ? await cmd.meta() : await cmd.meta;
      if (!meta?.version) {
        throw new CLIError("No version specified", "E_NO_VERSION");
      }
      console.log(meta.version);
    } else {
      await runCommand(cmd, { rawArgs });
    }
  } catch (error: any) {
    const isCLIError = error instanceof CLIError;
    if (isCLIError) {
      await showUsage(...(await resolveSubCommand(cmd, rawArgs)));
      console.error(error.message);
    } else {
      console.error(error, "\n");
    }
    process.exit(1);
  }
}

export function createMain<T extends ArgsDef = ArgsDef>(
  cmd: CommandDef<T>,
): (opts?: RunMainOptions) => Promise<void> {
  return (opts: RunMainOptions = {}) => runMain(cmd, opts);
}
