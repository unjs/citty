import { kebabCase, camelCase } from "scule";
import type { CommandContext, CommandDef, ArgsDef } from "./types.ts";
import { CLIError, resolveValue } from "./_utils.ts";
import { parseArgs } from "./args.ts";
import { cyan } from "./_color.ts";

export function defineCommand<const T extends ArgsDef = ArgsDef>(
  def: CommandDef<T>,
): CommandDef<T> {
  return def;
}

export interface RunCommandOptions {
  rawArgs: string[];
  data?: any;
  showUsage?: boolean;
}

export async function runCommand<T extends ArgsDef = ArgsDef>(
  cmd: CommandDef<T>,
  opts: RunCommandOptions,
): Promise<{ result: unknown }> {
  const cmdArgs = await resolveValue(cmd.args || {});
  const parsedArgs = parseArgs<T>(opts.rawArgs, cmdArgs);

  const context: CommandContext<T> = {
    rawArgs: opts.rawArgs,
    args: parsedArgs,
    data: opts.data,
    cmd,
  };

  // Setup hook
  if (typeof cmd.setup === "function") {
    await cmd.setup(context);
  }

  // Handle sub command
  let result: unknown;
  try {
    const subCommands = await resolveValue(cmd.subCommands);
    if (subCommands && Object.keys(subCommands).length > 0) {
      const subCommandArgIndex = findSubCommandIndex(opts.rawArgs, cmdArgs);
      const subCommandName = opts.rawArgs[subCommandArgIndex];
      if (subCommandName) {
        if (!subCommands[subCommandName]) {
          throw new CLIError(`Unknown command ${cyan(subCommandName)}`, "E_UNKNOWN_COMMAND");
        }
        const subCommand = await resolveValue(subCommands[subCommandName]);
        if (subCommand) {
          await runCommand(subCommand, {
            rawArgs: opts.rawArgs.slice(subCommandArgIndex + 1),
          });
        }
      } else if (!cmd.run) {
        throw new CLIError(`No command specified.`, "E_NO_COMMAND");
      }
    }

    // Handle main command
    if (typeof cmd.run === "function") {
      result = await cmd.run(context);
    }
  } finally {
    if (typeof cmd.cleanup === "function") {
      await cmd.cleanup(context);
    }
  }
  return { result };
}

export async function resolveSubCommand<T extends ArgsDef = ArgsDef>(
  cmd: CommandDef<T>,
  rawArgs: string[],
  parent?: CommandDef<T>,
): Promise<[CommandDef<T>, CommandDef<T>?]> {
  const subCommands = await resolveValue(cmd.subCommands);
  if (subCommands && Object.keys(subCommands).length > 0) {
    const cmdArgs = await resolveValue(cmd.args || {});
    const subCommandArgIndex = findSubCommandIndex(rawArgs, cmdArgs);
    const subCommandName = rawArgs[subCommandArgIndex]!;
    const subCommand = await resolveValue(subCommands[subCommandName]);
    if (subCommand) {
      return resolveSubCommand(subCommand, rawArgs.slice(subCommandArgIndex + 1), cmd);
    }
  }
  return [cmd, parent];
}

// --- internal ---

function findSubCommandIndex(rawArgs: string[], argsDef: ArgsDef): number {
  const valuedFlags = new Set<string>();
  for (const [name, def] of Object.entries(argsDef)) {
    if (def.type === "string" || def.type === "enum") {
      valuedFlags.add(`--${name}`);
      valuedFlags.add(`--${kebabCase(name)}`);
      valuedFlags.add(`--${camelCase(name)}`);
      const aliases = Array.isArray(def.alias) ? def.alias : def.alias ? [def.alias] : [];
      for (const a of aliases) {
        valuedFlags.add(a.length === 1 ? `-${a}` : `--${a}`);
      }
    }
  }

  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i]!;
    if (arg === "--") return -1;
    if (arg.startsWith("-")) {
      if (!arg.includes("=") && valuedFlags.has(arg)) {
        i++; // skip the flag's value
      }
      continue;
    }
    return i;
  }
  return -1;
}
