import { kebabCase, camelCase } from "scule";
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
  const parsedArgsProxyHandler = {
    get(target: ParsedArgs, prop: string) {
      const kebabCasedName = kebabCase(prop);
      if (kebabCasedName in target) {
        return target[kebabCasedName];
      }
      return target[prop];
    },
  };
  const parsedArgsProxy = new Proxy(parsed, parsedArgsProxyHandler);
  const [, ...positionalArguments] = parsedArgsProxy._;

  for (const [, arg] of args.entries()) {
    const kebabCasedName = kebabCase(arg.name);
    if (arg.type === "positional") {
      const nextPositionalArgument = positionalArguments.shift();
      if (nextPositionalArgument !== undefined) {
        parsedArgsProxy[arg.name] = nextPositionalArgument;
      } else if (arg.default !== undefined) {
        parsedArgsProxy[arg.name] = arg.default;
      } else {
        throw new CLIError(
          `Missing required positional argument: ${arg.name.toUpperCase()}`,
          "EARG"
        );
      }
    } else if (
      kebabCasedName !== arg.name &&
      kebabCasedName in parsedArgsProxy
    ) {
      parsedArgsProxy[arg.name] = parsedArgsProxy[kebabCasedName];
      delete parsedArgsProxy[kebabCasedName];
    } else if (arg.required && parsedArgsProxy[arg.name] === undefined) {
      throw new CLIError(`Missing required argument: --${arg.name}`, "EARG");
    }
  }

  return parsedArgsProxy;
}

export function resolveArgs(argsDef: ArgsDef): Arg[] {
  const args: Arg[] = [];
  for (const [name, argDef] of Object.entries(argsDef || {})) {
    args.push({
      ...argDef,
      name: camelCase(name),
      alias: toArray((argDef as any).alias),
    });
  }
  return args;
}
