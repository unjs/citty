import consola from "consola";
import type { ArgsDef, CommandDef } from "./types";
import { resolveSubCommand, runCommand } from "./command";
import { CLIError } from "./_utils";
import { showUsage as _showUsage } from "./usage";

export interface RunMainOptions {
  rawArgs?: string[];
  showUsage?: typeof _showUsage;
}

export interface RunArgs<T extends ArgsDef = ArgsDef> {
  cmd: CommandDef<T>;
  rawArgs: string[];
  showUsage?: typeof _showUsage;
}

export interface RunHandlers<
  T extends ArgsDef = ArgsDef,
  E extends Error = Error,
> {
  command: (args: RunArgs<T>) => Promise<void>;
  error: (args: RunArgs<T>, error: E) => Promise<void>;
}

export async function handleCommand<T extends ArgsDef = ArgsDef>({
  cmd,
  rawArgs,
  showUsage,
}: RunArgs<T>): Promise<void> {
  if ((rawArgs.includes("--help") || rawArgs.includes("-h")) && showUsage) {
    await showUsage(...(await resolveSubCommand(cmd, rawArgs)));
    process.exit(0);
  } else if (rawArgs.length === 1 && rawArgs[0] === "--version") {
    const meta =
      typeof cmd.meta === "function" ? await cmd.meta() : await cmd.meta;
    if (!meta?.version) {
      throw new CLIError("No version specified", "E_NO_VERSION");
    }
    consola.log(meta.version);
  } else {
    await runCommand(cmd, { rawArgs });
  }
}

export async function handleError<
  T extends ArgsDef = ArgsDef,
  E extends Error = Error,
>({ cmd, rawArgs, showUsage }: RunArgs<T>, error: E) {
  const isCLIError = error instanceof CLIError;
  if (!isCLIError) {
    consola.error(error, "\n");
  }
  if (isCLIError && showUsage) {
    await showUsage(...(await resolveSubCommand(cmd, rawArgs)));
  }
  consola.error(error.message);
  process.exit(1);
}

export async function runRawMain<T extends ArgsDef = ArgsDef>(
  cmd: CommandDef<T>,
  handlers: RunHandlers<T>,
  opts: RunMainOptions = {},
) {
  const rawArgs = opts.rawArgs || process.argv.slice(2);
  const args = { cmd, rawArgs, showUsage: opts.showUsage };
  try {
    await handlers.command(args);
  } catch (error: any) {
    await handlers.error(args, error);
  }
}

export async function runMain<T extends ArgsDef = ArgsDef>(
  cmd: CommandDef<T>,
  opts: RunMainOptions = {},
) {
  opts.showUsage = opts.showUsage || _showUsage;
  await runRawMain(cmd, { command: handleCommand, error: handleError }, opts);
}

export function createMain<T extends ArgsDef = ArgsDef>(
  cmd: CommandDef<T>,
): (opts?: RunMainOptions) => Promise<void> {
  return (opts: RunMainOptions = {}) => runMain(cmd, opts);
}
