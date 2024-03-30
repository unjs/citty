// ----- Args -----

export type ArgType =
  | "boolean"
  | "string"
  | "number"
  | "enum"
  | "positional"
  | undefined;

export type ArgAlias = string | string[]

export type ArgDefault = string | number | boolean | (string | number)[]

export type DefaultOrRequiredArgDef<DefaultT extends ArgDefault> = {
    default?: DefaultT
    required?: false | undefined
} | {
    default?: undefined
    required?: boolean
}

export type BaseArgDef<TypeT extends ArgType, DefaultT extends ArgDefault> = {
    type: TypeT;
    description?: string;
    valueHint?: string;
} & DefaultOrRequiredArgDef<DefaultT>

export type BooleanArgDef = BaseArgDef<'boolean', boolean> & {
    alias?: ArgAlias;
    negativeDescription?: string;
}

export type StringArgDef = BaseArgDef<'string', string> & {
    alias?: ArgAlias;
}

export type NumberArgDef = BaseArgDef<'number', number> & {
    alias?: ArgAlias;
}

export type EnumArgDef = BaseArgDef<'enum', string | number> & {
    options: (string | number)[];
    alias?: ArgAlias;
}

export type PositionalArgDef = BaseArgDef<'positional', string>

export type ArgDef =
  | BooleanArgDef
  | StringArgDef
  | NumberArgDef
  | EnumArgDef
  | PositionalArgDef;

export type ArgsDef = Record<string, ArgDef>;

export type Arg = ArgDef & { name: string; };

export type ParsedArg<ArgT extends ArgDef, ExtendsArgT extends ArgDef> = ArgT extends ExtendsArgT
    ? ArgT['required'] extends true
        ? ArgT extends { options: (infer U)[] }
            ? U
            : Exclude<ExtendsArgT['default'], undefined>
        : ArgT['default'] extends Exclude<ExtendsArgT['default'], undefined>
            ? ArgT extends { options: (infer U)[] }
                ? U
                : Exclude<ExtendsArgT['default'], undefined>
            : ArgT extends { options: (infer U)[] }
                ? U | undefined
                : ExtendsArgT['default']
    : never

export type ParsedArgs<T extends ArgsDef = ArgsDef> =
  { _: string[] } &
  {
    [K in keyof T]:
     | ParsedArg<T[K], BooleanArgDef>
     | ParsedArg<T[K], StringArgDef>
     | ParsedArg<T[K], NumberArgDef>
     | ParsedArg<T[K], EnumArgDef>
     | ParsedArg<T[K], PositionalArgDef>
  } &
  Record<string, string | number | boolean | string[]>;

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
  cmd: CommandDef<T>;
  subCommand?: CommandDef<T>;
  data?: any;
};

// ----- Utils -----

export type Awaitable<T> = () => T | Promise<T>;
export type Resolvable<T> = T | Promise<T> | (() => T) | (() => Promise<T>);
