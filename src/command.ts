import { camelCase } from "scule";
import type { CommandContext, CommandDef, ArgsDef, SubCommandsDef } from "./types.ts";
import { CLIError, resolveValue, toArray } from "./_utils.ts";
import { parseArgs } from "./args.ts";
import { cyan } from "./_color.ts";
import { resolvePlugins } from "./plugin.ts";

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

  // Resolve plugins
  const plugins = await resolvePlugins(cmd.plugins ?? []);

  let result: unknown;
  let runError: unknown;
  try {
    // Plugin setup hooks
    for (const plugin of plugins) {
      await plugin.setup?.(context);
    }

    // Setup hook
    if (typeof cmd.setup === "function") {
      await cmd.setup(context);
    }

    // Handle sub command
    const subCommands = await resolveValue(cmd.subCommands);
    if (subCommands && Object.keys(subCommands).length > 0) {
      const subCommandArgIndex = findSubCommandIndex(opts.rawArgs, cmdArgs);
      const explicitName = opts.rawArgs[subCommandArgIndex];

      if (explicitName) {
        const subCommand = await _findSubCommand(subCommands, explicitName);
        if (!subCommand) {
          throw new CLIError(`Unknown command ${cyan(explicitName)}`, "E_UNKNOWN_COMMAND");
        }
        await runCommand(subCommand, {
          rawArgs: opts.rawArgs.slice(subCommandArgIndex + 1),
        });
      } else {
        // No explicit sub command — check for default
        const defaultSubCommand = await resolveValue(cmd.default);
        if (defaultSubCommand) {
          if (cmd.run) {
            throw new CLIError(
              `Cannot specify both 'run' and 'default' on the same command.`,
              "E_DEFAULT_CONFLICT",
            );
          }
          const subCommand = await _findSubCommand(subCommands, defaultSubCommand);
          if (!subCommand) {
            throw new CLIError(
              `Default sub command ${cyan(defaultSubCommand)} not found in subCommands.`,
              "E_UNKNOWN_COMMAND",
            );
          }
          await runCommand(subCommand, {
            rawArgs: opts.rawArgs,
          });
        } else if (!cmd.run) {
          throw new CLIError(`No command specified.`, "E_NO_COMMAND");
        }
      }
    }

    // Handle main command
    if (typeof cmd.run === "function") {
      result = await cmd.run(context);
    }
  } catch (error) {
    runError = error;
  }

  // Cleanup (always runs)
  const cleanupErrors: unknown[] = [];
  if (typeof cmd.cleanup === "function") {
    try {
      await cmd.cleanup(context);
    } catch (error) {
      cleanupErrors.push(error);
    }
  }
  // Plugin cleanup hooks (reverse order)
  for (const plugin of [...plugins].reverse()) {
    try {
      await plugin.cleanup?.(context);
    } catch (error) {
      cleanupErrors.push(error);
    }
  }

  // Rethrow errors
  if (runError) {
    throw runError;
  }
  if (cleanupErrors.length === 1) {
    throw cleanupErrors[0];
  }
  if (cleanupErrors.length > 1) {
    throw new Error("Multiple cleanup errors", { cause: cleanupErrors });
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
    const subCommand = await _findSubCommand(subCommands, subCommandName);
    if (subCommand) {
      return resolveSubCommand(subCommand, rawArgs.slice(subCommandArgIndex + 1), cmd);
    }
  }
  return [cmd, parent];
}

// --- internal ---

async function _findSubCommand(
  subCommands: SubCommandsDef,
  name: string,
): Promise<CommandDef<any> | undefined> {
  // Direct key match (fast path — no resolution needed)
  if (name in subCommands) {
    return resolveValue(subCommands[name]);
  }
  // Alias lookup (resolves subcommands to check meta.alias)
  for (const sub of Object.values(subCommands)) {
    const resolved = await resolveValue(sub);
    const meta = await resolveValue(resolved?.meta);
    if (meta?.alias) {
      const aliases = toArray(meta.alias);
      if (aliases.includes(name)) {
        return resolved;
      }
    }
  }
}

function findSubCommandIndex(rawArgs: string[], argsDef: ArgsDef): number {
  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i]!;
    if (arg === "--") return -1;
    if (arg.startsWith("-")) {
      if (!arg.includes("=") && _isValueFlag(arg, argsDef)) {
        i++; // skip the flag's value
      }
      continue;
    }
    return i;
  }
  return -1;
}

function _isValueFlag(flag: string, argsDef: ArgsDef): boolean {
  const name = flag.replace(/^-{1,2}/, "");
  const normalized = camelCase(name);
  for (const [key, def] of Object.entries(argsDef)) {
    if (def.type !== "string" && def.type !== "enum") continue;
    if (normalized === camelCase(key)) return true;
    const aliases = Array.isArray(def.alias) ? def.alias : def.alias ? [def.alias] : [];
    if (aliases.includes(name)) return true;
  }
  return false;
}
