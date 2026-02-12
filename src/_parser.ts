import { parseArgs } from "node:util";

export interface ParseOptions {
  boolean?: string[];
  string?: string[];
  alias?: Record<string, string[]>;
  default?: Record<string, any>;
}

export type Argv<T = Record<string, any>> = T & {
  _: string[];
};

export function parseRawArgs<T = Record<string, any>>(
  args: string[] = [],
  opts: ParseOptions = {},
): Argv<T> {
  const booleans = new Set(opts.boolean || []);
  const strings = new Set(opts.string || []);
  const aliasMap = opts.alias || {};
  const defaults = opts.default || {};

  // Build a normalized alias map where we track primary -> aliases relationships
  // The input format is { alias: primary } or { alias: [primary1, primary2] }
  // We also need to handle { primary: alias } format used by args.ts
  const aliasToMain: Map<string, string> = new Map();
  const mainToAliases: Map<string, string[]> = new Map();

  for (const [key, value] of Object.entries(aliasMap)) {
    const targets = value;
    for (const target of targets) {
      // key is an alias for target
      aliasToMain.set(key, target);
      if (!mainToAliases.has(target)) {
        mainToAliases.set(target, []);
      }
      mainToAliases.get(target)!.push(key);

      // Also set up reverse: target is an alias for key
      aliasToMain.set(target, key);
      if (!mainToAliases.has(key)) {
        mainToAliases.set(key, []);
      }
      mainToAliases.get(key)!.push(target);
    }
  }

  // Build options for node:util parseArgs
  const options: Record<
    string,
    {
      type: "boolean" | "string";
      short?: string;
      default?: any;
      multiple?: boolean;
    }
  > = {};

  // Helper to get option type
  function getType(name: string): "boolean" | "string" {
    if (booleans.has(name)) return "boolean";
    // Check aliases
    const aliases = mainToAliases.get(name) || [];
    for (const alias of aliases) {
      if (booleans.has(alias)) return "boolean";
    }
    return "string";
  }

  // Collect all option names
  const allOptions = new Set<string>([
    ...booleans,
    ...strings,
    ...Object.keys(aliasMap),
    ...Object.values(aliasMap).flat(),
    ...Object.keys(defaults),
  ]);

  // Register all options
  for (const name of allOptions) {
    if (!options[name]) {
      const type = getType(name);
      options[name] = {
        type,
        default: defaults[name],
      };
    }
  }

  // Add short aliases (single char)
  for (const [alias, main] of aliasToMain.entries()) {
    if (alias.length === 1 && options[main] && !options[main].short) {
      options[main].short = alias;
    }
  }

  // Handle --no- prefixed arguments by preprocessing
  const processedArgs: string[] = [];
  const negatedFlags: Record<string, boolean> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;

    if (arg === "--") {
      // Pass through -- and everything after
      processedArgs.push(...args.slice(i));
      break;
    }

    // Handle --no-flag syntax
    if (arg.startsWith("--no-")) {
      const flagName = arg.slice(5);
      negatedFlags[flagName] = true;
      continue;
    }

    processedArgs.push(arg);
  }

  let parsed: { values: Record<string, any>; positionals: string[] };

  try {
    parsed = parseArgs({
      args: processedArgs,
      options: Object.keys(options).length > 0 ? options : undefined,
      allowPositionals: true,
      strict: false,
    });
  } catch {
    // Fallback for parsing errors
    parsed = { values: {}, positionals: processedArgs };
  }

  // Build result
  const out: Argv<T> = { _: [] as string[] } as Argv<T>;

  // Add positionals
  out._ = parsed.positionals;

  // Add parsed values
  for (const [key, value] of Object.entries(parsed.values)) {
    (out as any)[key] = value;
  }

  // Apply negated flags (with alias resolution)
  for (const [name] of Object.entries(negatedFlags)) {
    // Set the flag itself
    (out as any)[name] = false;

    // Resolve to main option and apply there too (handles --no-alias)
    const mainName = aliasToMain.get(name);
    if (mainName) {
      (out as any)[mainName] = false;
    }

    // Also apply to all aliases of this name (handles --no-main for aliases)
    const aliases = mainToAliases.get(name);
    if (aliases) {
      for (const alias of aliases) {
        (out as any)[alias] = false;
      }
    }
  }

  // Propagate values between aliases
  for (const [alias, main] of aliasToMain.entries()) {
    if ((out as any)[alias] !== undefined && (out as any)[main] === undefined) {
      (out as any)[main] = (out as any)[alias];
    }
    if ((out as any)[main] !== undefined && (out as any)[alias] === undefined) {
      (out as any)[alias] = (out as any)[main];
    }
  }

  return out;
}
