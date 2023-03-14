import type { CommandDef } from "./types";
import { CLIError, resolveValue } from "./_utils";
import { parseArgs } from "./args";

export function defineCommand(def: CommandDef): CommandDef {
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
  // Handle main command
  if (typeof cmd.run === "function") {
    const cmdArgs = await resolveValue(cmd.args || {});
    const parsedArgs = parseArgs(opts.rawArgs, cmdArgs);
    await cmd.run({
      rawArgs: opts.rawArgs,
      args: parsedArgs,
      cmd,
    });
  }

  // Handle sub command
  const subCommands = await resolveValue(cmd.subCommands);
  if (subCommands && Object.keys(subCommands.length > 0)) {
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
        rawArgs: opts.rawArgs.slice(subCommandArgIndex),
      });
    }
  }
}

export async function resolveSubCommand(
  cmd: CommandDef,
  rawArgs: string[],
  parent?: CommandDef
): Promise<[CommandDef, CommandDef?]> {
  const subCommands = await resolveValue(cmd.subCommands);
  if (subCommands && Object.keys(subCommands.length > 0)) {
    const subCommandArgIndex = rawArgs.findIndex((arg) => !arg.startsWith("-"));
    const subCommandName = rawArgs[subCommandArgIndex];
    const subCommand = await resolveValue(subCommands[subCommandName]);
    if (subCommand) {
      return resolveSubCommand(
        subCommand,
        rawArgs.slice(subCommandArgIndex),
        cmd
      );
    }
  }
  return [cmd, parent];
}
