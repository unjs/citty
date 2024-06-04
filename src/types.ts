// ----- Args -----

export type ArgType =
  | "boolean"
  | "string"
  | "number"
  | "enum"
  | "positional"
  | undefined;

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

export type RequiredArgs<T extends Record<string, any>, P> = {
  [K in keyof T]: K extends P ? NonNullable<T[K]> : T[K];
};

export type ParsedArgs<T extends ArgsDef = ArgsDef> = {
  _: string[];
} & RequiredArgs<
  Record<
    {
      [K in keyof T]: T[K] extends { type: "positional" } ? K : never;
    }[keyof T],
    string | undefined
  > &
    Record<
      {
        [K in keyof T]: T[K] extends { type: "string" } ? K : never;
      }[keyof T],
      string | undefined
    > &
    Record<
      {
        [K in keyof T]: T[K] extends { type: "number" } ? K : never;
      }[keyof T],
      number | undefined
    > &
    Record<
      {
        [K in keyof T]: T[K] extends { type: "boolean" } ? K : never;
      }[keyof T],
      boolean | undefined
    > &
    Record<
      {
        [K in keyof T]: T[K] extends { type: "enum" } ? K : never;
      }[keyof T],
      | {
          [K in keyof T]: T[K] extends { options: Array<infer U> } ? U : never;
        }[keyof T]
      | undefined
    >,
  {
    [K in keyof T]: T[K] extends
      | { required: true }
      | { default: string | number | boolean }
      ? K
      : never;
  }[keyof T]
> &
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
