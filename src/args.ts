import { kebabCase, camelCase } from "scule";
import { parseRawArgs } from "./_parser";
import type { Arg, ArgAlias, ArgDefault, ArgsDef, ParsedArgs } from "./types";
import { CLIError, toArray } from "./_utils";

export function parseArgs<T extends ArgsDef = ArgsDef>(
  rawArgs: string[],
  argsDef: ArgsDef,
): ParsedArgs<T> {
  const parseOptions: {
    boolean: string[]
    string: string[]
    number: string[]
    enum: (string | number)[]
    mixed: string[]
    alias: Record<string, ArgAlias>
    default: Record<string, ArgDefault>
  } = {
    boolean: [],
    string: [],
    number: [],
    enum: [],
    mixed: [],
    alias: {},
    default: {}
  };

  const args = resolveArgs(argsDef);

  for (const arg of args) {
    if (arg.type === "positional") {
      continue;
    }

    // eslint-disable-next-line unicorn/prefer-switch
    if (arg.type === "string" || arg.type === "number") {
      parseOptions.string.push(arg.name);
    } else if (arg.type === "boolean") {
      parseOptions.boolean.push(arg.name);
    } else if (arg.type === "enum") {
      parseOptions.enum.push(...(arg.options || []));
    }

    if (arg.default !== undefined) {
      parseOptions.default[arg.name] = arg.default;
    }

    if (arg.alias) {
      parseOptions.alias[arg.name] = arg.alias;
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
    // eslint-disable-next-line unicorn/prefer-switch
    if (arg.type === "positional") {
      const nextPositionalArgument = positionalArguments.shift();
      if (nextPositionalArgument !== undefined) {
        parsedArgsProxy[arg.name] = nextPositionalArgument;
      } else if (arg.required) {
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
          `Invalid value for argument: \`--${arg.name}\` (\`${argument}\`). Expected one of: ${options.map((o) => `\`${o}\``).join(", ")}.`,
          "EARG",
        );
      }
    } else if (arg.type === "number") {
      const _originalValue = parsedArgsProxy[arg.name];
      parsedArgsProxy[arg.name] = Number.parseFloat(
        parsedArgsProxy[arg.name] as string,
      );
      if (Number.isNaN(parsedArgsProxy[arg.name])) {
        throw new CLIError(
          `Invalid value for argument: \`--${arg.name}\` (\`${_originalValue}\`). Expected a number.`,
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
      alias: 'alias' in argDef ? toArray(argDef.alias) : [],
    });
  }

  return args;
}
