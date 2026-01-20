import { kebabCase, camelCase } from "scule";
import { parseRawArgs, type ParseOptions } from "./_parser.ts";
import type { Arg, ArgsDef, ParsedArgs } from "./types.ts";
import { CLIError, toArray } from "./_utils.ts";
import { cyan } from "./_color.ts";

export function parseArgs<T extends ArgsDef = ArgsDef>(
  rawArgs: string[],
  argsDef: ArgsDef,
): ParsedArgs<T> {
  const parseOptions = {
    boolean: [] as string[],
    string: [] as string[],
    alias: {} as Record<string, string[]>,
    default: {} as Record<string, boolean | string>,
  } satisfies ParseOptions;

  const args = resolveArgs(argsDef);

  for (const arg of args) {
    if (arg.type === "positional") {
      continue;
    }
    if (arg.type === "string" || arg.type === "enum") {
      parseOptions.string.push(arg.name);
    } else if (arg.type === "boolean") {
      parseOptions.boolean.push(arg.name);
    }
    if (arg.default !== undefined) {
      parseOptions.default[arg.name] = arg.default;
    }
    if (arg.alias) {
      parseOptions.alias[arg.name] = arg.alias;
    }

    // Add camelCase/kebab-case variants as aliases for case-insensitive matching
    const camelName = camelCase(arg.name);
    const kebabName = kebabCase(arg.name);
    if (camelName !== arg.name || kebabName !== arg.name) {
      const existingAliases = toArray(parseOptions.alias[arg.name] || []);
      if (camelName !== arg.name && !existingAliases.includes(camelName)) {
        existingAliases.push(camelName);
      }
      if (kebabName !== arg.name && !existingAliases.includes(kebabName)) {
        existingAliases.push(kebabName);
      }
      if (existingAliases.length > 0) {
        parseOptions.alias[arg.name] = existingAliases;
      }
    }
  }

  const parsed = parseRawArgs(rawArgs, parseOptions);
  const [...positionalArguments] = parsed._;

  const parsedArgsProxy = new Proxy(parsed, {
    get(target: ParsedArgs<any>, prop: string) {
      return target[prop] ?? target[camelCase(prop)] ?? target[kebabCase(prop)];
    },
  });

  for (const [, arg] of args.entries()) {
    if (arg.type === "positional") {
      const nextPositionalArgument = positionalArguments.shift();
      if (nextPositionalArgument !== undefined) {
        parsedArgsProxy[arg.name] = nextPositionalArgument;
      } else if (arg.default === undefined && arg.required !== false) {
        throw new CLIError(
          `Missing required positional argument: ${arg.name.toUpperCase()}`,
          "EARG",
        );
      } else {
        parsedArgsProxy[arg.name] = arg.default;
      }
    } else if (arg.type === "enum") {
      const argument = parsedArgsProxy[arg.name];
      const options = arg.options || [];
      if (
        argument !== undefined &&
        options.length > 0 &&
        !options.includes(argument)
      ) {
        throw new CLIError(
          `Invalid value for argument: ${cyan(`--${arg.name}`)} (${cyan(argument)}). Expected one of: ${options.map((o) => cyan(o)).join(", ")}.`,
          "EARG",
        );
      }
    } else if (arg.required && parsedArgsProxy[arg.name] === undefined) {
      throw new CLIError(`Missing required argument: --${arg.name}`, "EARG");
    }
  }

  return parsedArgsProxy as ParsedArgs<T>;
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
