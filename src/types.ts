// ----- Args -----

export type ArgType = "boolean" | "string" | "positional" | undefined;

export type _ArgDef<T extends ArgType, VT extends boolean | string> = {
  type?: T;
  description?: string;
  valueHint?: string;
  alias?: string | string[];
  default?: VT;
  required?: boolean;
};

export type BooleanArgDef = _ArgDef<"boolean", boolean>;
export type StringArgDef = _ArgDef<"string", string>;
export type PositionalArgDef = Omit<_ArgDef<"positional", string>, "alias">;
export type ArgDef = BooleanArgDef | StringArgDef | PositionalArgDef;
export type ArgsDef = Record<string, ArgDef>;
export type Arg = ArgDef & { name: string; alias: string[] };
export type ParsedArgs = Record<string, string | boolean> & { _: string[] };

// ----- Command -----

// Command: Shared

export interface CommandMeta {
  name?: string;
  version?: string;
  description?: string;
}

// Command: Definition

export type SubCommandsDef = Record<string, Resolvable<CommandDef>>;

export type CommandDef = {
  meta?: Resolvable<CommandMeta>;
  args?: Resolvable<ArgsDef>;
  subCommands?: Resolvable<SubCommandsDef>;
  setup?: (context: CommandContext) => any | Promise<any>;
  cleanup?: (context: CommandContext) => any | Promise<any>;
  run?: (context: CommandContext) => any | Promise<any>;
};

export interface CommandContext {
  rawArgs: string[];
  args: ParsedArgs;
  cmd: CommandDef;
  subCommand?: CommandDef;
}

// ----- Utils -----

export type Awaitable<T> = () => T | Promise<T>;
export type Resolvable<T> = T | Promise<T> | (() => T) | (() => Promise<T>);
