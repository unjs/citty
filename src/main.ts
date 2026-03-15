import type { ArgsDef, CommandDef } from "./types.ts";
import { resolveSubCommand, runCommand } from "./command.ts";
import { CLIError, resolveValue, toArray } from "./_utils.ts";
import { showUsage as _showUsage } from "./usage.ts";

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
    const builtinFlags = await _resolveBuiltinFlags(cmd);
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

// --- internal ---

async function _resolveBuiltinFlags<T extends ArgsDef>(
  cmd: CommandDef<T>,
): Promise<{ help: string[]; version: string[] }> {
  const argsDef = await resolveValue(cmd.args || ({} as ArgsDef));
  const userNames = new Set<string>();
  const userAliases = new Set<string>();
  for (const [name, def] of Object.entries(argsDef)) {
    userNames.add(name);
    for (const alias of toArray((def as any).alias)) {
      userAliases.add(alias);
    }
  }
  return {
    help: _getBuiltinFlags("help", "h", userNames, userAliases),
    version: _getBuiltinFlags("version", "v", userNames, userAliases),
  };
}

function _getBuiltinFlags(
  long: string,
  short: string,
  userNames: Set<string>,
  userAliases: Set<string>,
): string[] {
  const hasLong = userNames.has(long) || userAliases.has(long);
  if (hasLong) {
    return [];
  }
  const hasShort = userNames.has(short) || userAliases.has(short);
  if (hasShort) {
    return [`--${long}`];
  }
  return [`--${long}`, `-${short}`];
}
