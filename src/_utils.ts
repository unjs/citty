import type { CommandDef, Resolvable, SubCommandsDef } from "./types";

export function toArray(val: any) {
  if (Array.isArray(val)) {
    return val;
  }
  return val === undefined ? [] : [val];
}

export function formatLineColumns(lines: string[][], linePrefix = "") {
  const maxLength: number[] = [];
  for (const line of lines) {
    for (const [i, element] of line.entries()) {
      maxLength[i] = Math.max(maxLength[i] || 0, element.length);
    }
  }
  return lines
    .map((l) =>
      l
        .map(
          (c, i) =>
            linePrefix + c[i === 0 ? "padStart" : "padEnd"](maxLength[i]),
        )
        .join("  "),
    )
    .join("\n");
}

export function resolveValue<T>(input: Resolvable<T>): T | Promise<T> {
  return typeof input === "function" ? (input as any)() : input;
}

export async function getSubCommand(
  subCommands: SubCommandsDef,
  command: string,
): Promise<CommandDef<any>> {
  if (Object.keys(subCommands).includes(command)) {
    return resolveValue(subCommands[command]);
  }

  for (const subCommand of Object.values(subCommands)) {
    const resolvedSubCommand = await resolveValue(subCommand);
    for (const alias of toArray(resolvedSubCommand.alias)) {
      if (alias === command) {
        return resolvedSubCommand;
      }
    }
  }
  throw new CLIError(`Unknown command \`${command}\``, "E_UNKNOWN_COMMAND");
}

export class CLIError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "CLIError";
  }
}
