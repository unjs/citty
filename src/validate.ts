import { CLIError, toArray } from "./_utils";
import { ArgsDef, ParsedArgs } from "./types";

export function validateUnknownOptions<T extends ArgsDef = ArgsDef>(
  argsDef: T,
  args: ParsedArgs<T>,
): void {
  const names: string[] = [];
  for (const [name, argDef] of Object.entries(argsDef || {})) {
    names.push(name, ...toArray((argDef as any).alias));
  }

  for (const arg in args) {
    if (arg === "_") continue;

    if (!names.includes(arg)) {
      throw new CLIError(
        `Unknown option \`${arg.length > 1 ? `--${arg}` : `-${arg}`}\``,
        "E_UNKNOWN_OPTION",
      );
    }
  }
}
