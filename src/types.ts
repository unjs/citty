// ----- Args -----

export type ArgType =
  | "boolean"
  | "string"
  | "number"
  | "enum"
  | "positional"
  | undefined;

// Args: Definition

export type _ArgDef<T extends ArgType, VT extends boolean | number | string> = {
  type?: T;
  description?: string;
  valueHint?: string;
  alias?: string | string[];
  default?: VT;
  required?: boolean;
  options?: (string | number)[];
};

export type BooleanArgDef = Omit<_ArgDef<"boolean", boolean>, "options"> & {
  negativeDescription?: string;
};
export type StringArgDef = Omit<_ArgDef<"string", string>, "options">;
export type NumberArgDef = Omit<_ArgDef<"number", boolean>, "options">;
export type EnumArgDef = _ArgDef<"enum", string>;
export type PositionalArgDef = Omit<
  _ArgDef<"positional", string>,
  "alias" | "options"
>;

export type ArgDef =
  | BooleanArgDef
  | StringArgDef
  | NumberArgDef
  | PositionalArgDef
  | EnumArgDef;

export type ArgsDef = Record<string, ArgDef>;

export type Arg = ArgDef & { name: string; alias: string[] };

// Args: Parsed

type ResolveParsedArgType<
  T extends ArgDef,
  VT,
  Strict extends boolean = false,
> = T extends {
  default?: any;
  required?: boolean;
}
  ? T["default"] extends NonNullable<VT>
    ? VT
    : T["required"] extends true
      ? VT
      : Strict extends false
        ? VT
        : VT | undefined
  : Strict extends false
    ? VT
    : VT | undefined;

type ParsedPositionalArg<
  T extends ArgDef,
  Strict extends boolean = false,
> = T extends { type: "positional" }
  ? ResolveParsedArgType<T, string, Strict>
  : never;

type ParsedStringArg<
  T extends ArgDef,
  Strict extends boolean = false,
> = T extends { type: "string" }
  ? ResolveParsedArgType<T, string, Strict>
  : never;

type ParsedNumberArg<
  T extends ArgDef,
  Strict extends boolean = false,
> = T extends { type: "number" }
  ? ResolveParsedArgType<T, number, Strict>
  : never;

type ParsedBooleanArg<
  T extends ArgDef,
  Strict extends boolean = false,
> = T extends { type: "boolean" }
  ? ResolveParsedArgType<T, boolean, Strict>
  : never;

type ParsedEnumArg<
  T extends ArgDef,
  Strict extends boolean = false,
> = T extends {
  type: "enum";
  options: infer U;
}
  ? U extends Array<any>
    ? ResolveParsedArgType<T, U[number], Strict>
    : never
  : never;

type RawArgs = {
  _: string[];
};

export type ParsedArgs<
  T extends ArgsDef = ArgsDef,
  Strict extends boolean = false,
> = RawArgs & {
  [K in keyof T]:
    | ParsedPositionalArg<T[K], Strict>
    | ParsedStringArg<T[K], Strict>
    | ParsedNumberArg<T[K], Strict>
    | ParsedBooleanArg<T[K], Strict>
    | ParsedEnumArg<T[K], Strict>;
} & Record<string, string | number | boolean | string[]>;

// ----- Command -----

// Command: Shared

export interface CommandMeta {
  name?: string;
  version?: string;
  description?: string;
  hidden?: boolean;
}

// Command: Definition

export type SubCommandsDef = Record<string, Resolvable<CommandDef<any>>>;

export type CommandDef<
  T extends ArgsDef = ArgsDef,
  Strict extends boolean = false,
> = {
  meta?: Resolvable<CommandMeta>;
  args?: Resolvable<T>;
  subCommands?: Resolvable<SubCommandsDef>;
  setup?: (context: CommandContext<T, Strict>) => any | Promise<any>;
  cleanup?: (context: CommandContext<T, Strict>) => any | Promise<any>;
  run?: (context: CommandContext<T, Strict>) => any | Promise<any>;
};

export type CommandContext<
  T extends ArgsDef = ArgsDef,
  Strict extends boolean = false,
> = {
  rawArgs: string[];
  args: ParsedArgs<T, Strict>;
  cmd: CommandDef<T, Strict>;
  subCommand?: CommandDef<T, Strict>;
  data?: any;
};

// ----- Utils -----

export type Awaitable<T> = () => T | Promise<T>;
export type Resolvable<T> = T | Promise<T> | (() => T) | (() => Promise<T>);
