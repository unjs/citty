import type {
  CommandContext,
  CommandDef,
  ArgsDef,
  SubCommandsDef,
} from "./types";
import { CLIError, resolveValue } from "./_utils";
import { parseArgs } from "./args";

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

async function getSubCommand(
  subCommandsList: SubCommandsDef,
  subCommandName: string,
): Promise<CommandDef<any> | undefined> {
  const subCommand = await resolveValue(subCommandsList[subCommandName]);

  if (subCommand) {
    return subCommand;
  }

  for (const _subCmd of Object.values(subCommandsList)) {
    const subCmd = await resolveValue(_subCmd);
    const subCmdMeta = await resolveValue(subCmd.meta);
    if ((subCmdMeta?.aliases || []).includes(subCommandName)) {
      return subCmd;
    }
  }

  return undefined;
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
        const subCommand = await getSubCommand(subCommands, subCommandName);

        if (!subCommand) {
          throw new CLIError(
            `Unknown command \`${subCommandName}\``,
            "E_UNKNOWN_COMMAND",
          );
        }
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
    const subCommandArgIndex = rawArgs.findIndex((arg) => !arg.startsWith("-"));
    const subCommandName = rawArgs[subCommandArgIndex];
    const subCommand = await getSubCommand(subCommands, subCommandName);

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
