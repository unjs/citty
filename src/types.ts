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

export type ParsedArgs<T extends ArgsDef = ArgsDef> = { _: string[] } & Record<
  { [K in keyof T]: T[K] extends { type: "positional" } ? K : never }[keyof T],
  string | boolean
> &
  Record<
    {
      [K in keyof T]: T[K] extends { type: "string" } ? K : never;
    }[keyof T],
    string
  > &
  Record<
    {
      [K in keyof T]: T[K] extends { type: "boolean" } ? K : never;
    }[keyof T],
    boolean
  >;

// ----- Command -----

// Command: Shared

export interface CommandMeta {
  name?: string;
  version?: string;
  description?: string;
}

// Command: Definition

export type SubCommandsDef = Record<string, Resolvable<CommandDef<any>>>;

export type CommandDef<T extends ArgsDef = ArgsDef> = {
  meta?: Resolvable<CommandMeta>;
  args?: Resolvable<T>;
  subCommands?: Resolvable<SubCommandsDef>;
  setup?: (context: CommandContext<T>) => any | Promise<any>;
  cleanup?: (context: CommandContext<T>) => any | Promise<any>;
  run?: (context: CommandContext<T>) => any | Promise<any>;
};

export type CommandContext<T extends ArgsDef = ArgsDef> = {
  rawArgs: string[];
  args: ParsedArgs<T>;
  cmd: CommandDef;
  subCommand?: CommandDef<T>;
};

// ----- Utils -----

export type Awaitable<T> = () => T | Promise<T>;
export type Resolvable<T> = T | Promise<T> | (() => T) | (() => Promise<T>);
