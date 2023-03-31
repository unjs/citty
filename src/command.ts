import type { CommandContext, CommandDef, ArgsDef } from "./types";
import { CLIError, resolveValue } from "./_utils";
import { parseArgs } from "./args";

export function defineCommand<T extends ArgsDef = ArgsDef>(
  def: CommandDef<T>
): CommandDef<T> {
  return def;
}

export interface RunCommandOptions {
  rawArgs: string[];
  showUsage?: boolean;
}

export async function runCommand(
  cmd: CommandDef,
  opts: RunCommandOptions
): Promise<void> {
  const cmdArgs = await resolveValue(cmd.args || {});
  const parsedArgs = parseArgs(opts.rawArgs, cmdArgs);

  const context: CommandContext = {
    rawArgs: opts.rawArgs,
    args: parsedArgs,
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
      (arg) => !arg.startsWith("-")
    );
    const subCommandName = opts.rawArgs[subCommandArgIndex];
    if (!subCommandName && !cmd.run) {
      throw new CLIError(
        `Missing sub command. Use --help to see available sub commands.`,
        "ESUBCOMMAND"
      );
    }
    if (!subCommands[subCommandName]) {
      throw new CLIError(
        `Unknown sub command: ${subCommandName}`,
        "ESUBCOMMAND"
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

export async function resolveSubCommand(
  cmd: CommandDef,
  rawArgs: string[],
  parent?: CommandDef
): Promise<[CommandDef, CommandDef?]> {
  const subCommands = await resolveValue(cmd.subCommands);
  if (subCommands && Object.keys(subCommands).length > 0) {
    const subCommandArgIndex = rawArgs.findIndex((arg) => !arg.startsWith("-"));
    const subCommandName = rawArgs[subCommandArgIndex];
    const subCommand = await resolveValue(subCommands[subCommandName]);
    if (subCommand) {
      return resolveSubCommand(
        subCommand,
        rawArgs.slice(subCommandArgIndex + 1),
        cmd
      );
    }
  }
  return [cmd, parent];
}
