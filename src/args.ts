import { parseRawArgs } from "./_parser";
import type { Arg, ArgsDef, ParsedArgs } from "./types";
import { CLIError, toArray } from "./_utils";

export function parseArgs(rawArgs: string[], argsDef: ArgsDef): ParsedArgs {
  const parseOptions = {
    boolean: [] as string[],
    string: [] as string[],
    alias: {} as Record<string, string | string[]>,
    default: {} as Record<string, boolean | string>,
  };

  const args = resolveArgs(argsDef);

  for (const arg of args) {
    if (arg.type === "positional") {
      continue;
    }
    parseOptions[arg.type || "boolean"].push(arg.name);
    if (arg.default !== undefined) {
      parseOptions.default[arg.name] = arg.default;
    }
    if (arg.alias) {
      parseOptions.alias[arg.name] = arg.alias;
    }
  }

  const parsed = parseRawArgs(rawArgs, parseOptions);
  const [, ...positionalArguments] = parsed._;

  for (const [, arg] of args.entries()) {
    if (arg.type === "positional") {
      const nextPositionalArgument = positionalArguments.shift();
      if (nextPositionalArgument !== undefined) {
        parsed[arg.name] = nextPositionalArgument;
      } else if (arg.default !== undefined) {
        parsed[arg.name] = arg.default;
      } else {
        throw new CLIError(
          `Missing required positional argument: ${arg.name.toUpperCase()}`,
          "EARG"
        );
      }
    } else if (arg.required && parsed[arg.name] === undefined) {
      throw new CLIError(`Missing required argument: --${arg.name}`, "EARG");
    }
  }

  return parsed;
}

export function resolveArgs(argsDef: ArgsDef): Arg[] {
  const args: Arg[] = [];
  for (const [name, argDef] of Object.entries(argsDef || {})) {
    args.push({
      ...argDef,
      name,
      alias: toArray((argDef as any).alias),
    });
  }
  return args;
}
