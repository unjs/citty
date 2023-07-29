import type { CommandContext, CommandDef, ArgsDef } from "./types";
import { CLIError, resolveValue } from "./_utils";
import { parseArgs } from "./args";

export function defineCommand<T extends ArgsDef = ArgsDef>(
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
): Promise<void> {
  const cmdArgs = await resolveValue<ArgsDef>(cmd.args || {});
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
  const subCommands = await resolveValue(cmd.subCommands);
  if (subCommands && Object.keys(subCommands).length > 0) {
    const subCommandArgIndex = opts.rawArgs.findIndex(
      (arg) => !arg.startsWith("-"),
    );
    const subCommandName = opts.rawArgs[subCommandArgIndex];
    if (!subCommandName && !cmd.run) {
      throw new CLIError(`No command specified.`, "E_NO_COMMAND");
    } else if (
      typeof cmd.run === "function" &&
      Object.values(cmdArgs).some((arg) => arg.type === "positional")
    ) {
      await cmd.run(context);
      return;
    }
    if (!subCommands[subCommandName]) {
      throw new CLIError(
        `Unknown command \`${subCommandName}\``,
        "E_UNKNOWN_COMMAND",
      );
    }
    const subCommand = await resolveValue(subCommands[subCommandName]);
    if (subCommand) {
      await runCommand(subCommand, {
        rawArgs: opts.rawArgs.slice(subCommandArgIndex + 1),
      });
    }
  }

  // Handle main command
  if (typeof cmd.run === "function") {
    await cmd.run(context);
  }
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
    const subCommand = await resolveValue(subCommands[subCommandName]);
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
