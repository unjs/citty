import type {
  CommandContext,
  CommandDef,
  ArgsDef,
  SubCommandsDef,
} from "./types.ts";
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
      const subCommandArgIndex = opts.rawArgs.findIndex(
        (arg) => !arg.startsWith("-"),
      );
      const subCommandName = opts.rawArgs[subCommandArgIndex];
      if (subCommandName) {
        const subCommand = await _findSubCommand(subCommands, subCommandName);
        if (subCommand) {
          await runCommand(subCommand, {
            rawArgs: opts.rawArgs.slice(subCommandArgIndex + 1),
          });
        } else if (!cmd.run) {
          throw new CLIError(
            `Unknown command ${cyan(subCommandName)}`,
            "E_UNKNOWN_COMMAND",
          );
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
    const subCommandArgIndex = rawArgs.findIndex((arg) => !arg.startsWith("-"));
    const subCommandName = rawArgs[subCommandArgIndex]!;
    const subCommand = await _findSubCommand(subCommands, subCommandName);
    if (subCommand) {
      return resolveSubCommand(
        subCommand,
        rawArgs.slice(subCommandArgIndex + 1),
        cmd,
      );
    }
  }
  return [cmd, parent];
}

async function _findSubCommand(
  subCommands: SubCommandsDef,
  name: string,
): Promise<CommandDef<any> | undefined> {
  if (subCommands[name]) {
    return resolveValue(subCommands[name]);
  }
  for (const subCommand of Object.values(subCommands)) {
    const resolved = await resolveValue(subCommand);
    const alias = (await resolveValue(resolved.meta))?.alias;
    if (alias) {
      const aliases = Array.isArray(alias) ? alias : [alias];
      if (aliases.includes(name)) {
        return resolved;
      }
    }
  }
}
