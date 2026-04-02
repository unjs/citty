import { CLIError, toArray } from "./_utils.ts";
import type { ArgsDef, ParsedArgs } from "./types.ts";

export function validateUnknownOptions<T extends ArgsDef = ArgsDef>(
  argsDef: T,
  args: ParsedArgs<T>,
): void {
  const names = new Set<string>();
  for (const [name, argDef] of Object.entries(argsDef || {})) {
    names.add(name);
    for (const alias of toArray((argDef as any).alias)) {
      names.add(alias);
    }
  }

  for (const arg of Object.keys(args)) {
    if (arg === "_") continue;

    if (!names.has(arg)) {
      throw new CLIError(
        `Unknown option \`${arg.length > 1 ? `--${arg}` : `-${arg}`}\``,
        "E_UNKNOWN_OPTION",
      );
    }
  }
}
