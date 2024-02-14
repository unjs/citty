import consola from "consola";
import { colors } from "consola/utils";
import { formatLineColumns, resolveValue } from "./_utils";
import type { Arg, ArgsDef, CommandDef } from "./types";
import { resolveArgs } from "./args";

export async function showUsage<T extends ArgsDef = ArgsDef>(
  cmd: CommandDef<T>,
  parent?: CommandDef<T>,
) {
  try {
    const renderer = await new RenderUsage(cmd, parent);
    consola.log((await renderer.toString()) + "\n");
  } catch (error) {
    consola.error(error);
  }
}

/**
 * @deprecated Use `new RenderUsage(cmd, parent).toString()` instead.
 */
export function renderUsage<T extends ArgsDef = ArgsDef>(
  cmd: CommandDef<T>,
  parent?: CommandDef<T>,
) {
  const renderer = new RenderUsage(cmd, parent);
  return renderer.toString();
}

export abstract class AbstractCommandArgumentDef<T extends Arg = Arg> {
  public readonly arg: T;

  constructor(arg: T) {
    this.arg = arg;
  }

  public get name() {
    return this.arg.name;
  }

  public get description() {
    return this.arg.description || "";
  }

  public get type() {
    return this.arg.type || "string";
  }

  public get valueHint() {
    return this.arg.valueHint || "";
  }

  public get alias() {
    return this.arg.alias || [];
  }

  public get default() {
    return this.arg.default;
  }

  public get required() {
    return this.arg.required === true && this.arg.default === undefined;
  }
}

export class CommandOptionsDef<
  T extends Arg = Arg,
> extends AbstractCommandArgumentDef<T> {
  public get names(): string[] {
    const names = [...this.alias, this.name];
    const prefix =
      this.type === "boolean" && this.default === true ? "no-" : "";

    return names.map(
      (name) => `${name.length > 1 ? "-" : ""}-${prefix}${name}`,
    );
  }
}

export class CommandArgumentsDef<
  T extends Arg = Arg,
> extends AbstractCommandArgumentDef<T> {}

export abstract class AbstractCommandDef<T extends ArgsDef = ArgsDef> {
  protected readonly cmd: CommandDef<T>;
  protected readonly parent?: CommandDef<T>;

  constructor(cmd: CommandDef<T>, parent?: CommandDef<T>) {
    this.cmd = cmd;
    this.parent = parent;
  }

  public cmdMeta() {
    return resolveValue(this.cmd.meta || {});
  }

  public async cmdArgs() {
    return resolveArgs(await resolveValue(this.cmd.args || {}));
  }

  public parentMeta() {
    return resolveValue(this.parent?.meta || {});
  }

  public async version() {
    const cmdMeta = await this.cmdMeta();
    const parentMeta = await this.parentMeta();

    return cmdMeta.version || parentMeta.version;
  }

  public async subcommands() {
    const commands: RenderCommandDef<T>[] = [];

    if (this.cmd.subCommands) {
      const subCommands = await resolveValue(this.cmd.subCommands);

      for (const [name, sub] of Object.entries(subCommands)) {
        const subCmd = await resolveValue(sub);
        commands.push(new RenderCommandDef(subCmd, this.cmd, name));
      }
    }

    return commands;
  }
}

export class RenderCommandDef<
  T extends ArgsDef = ArgsDef,
> extends AbstractCommandDef<T> {
  constructor(
    cmd: CommandDef<T>,
    parent?: CommandDef<T>,
    protected readonly _name?: string,
  ) {
    super(cmd, parent);
  }

  public async commandName() {
    const parentMeta = await this.parentMeta();
    const name = await this.name();

    return `${parentMeta.name ? `${parentMeta.name} ` : ""}` + name;
  }

  public async name() {
    if (this._name) {
      return this._name;
    }

    const cmdMeta = await this.cmdMeta();

    return cmdMeta.name || process.argv[1];
  }

  public async description() {
    const cmdMeta = await this.cmdMeta();

    return cmdMeta.description || "";
  }

  public async arguments() {
    const cmdArgs = await this.cmdArgs();

    return cmdArgs
      .filter((arg) => arg.type === "positional")
      .map((arg) => new CommandArgumentsDef(arg));
  }

  public async properties() {
    const cmdArgs = await this.cmdArgs();

    return cmdArgs
      .filter((arg) => arg.type !== "positional")
      .map((arg) => new CommandOptionsDef(arg));
  }
}

export class RenderUsage<T extends ArgsDef = ArgsDef> implements IRendersUsage {
  public readonly command: RenderCommandDef<T>;

  constructor(cmd: CommandDef<T>, parent?: CommandDef<T>, _name?: string) {
    this.command = new RenderCommandDef<T>(cmd, parent, _name);
  }

  public async description(): Promise<string> {
    const [cmdMeta, commandName, version] = await Promise.all([
      this.command.cmdMeta(),
      this.command.commandName(),
      this.command.version(),
    ]);

    return colors.gray(
      `${cmdMeta.description} (${commandName + (version ? ` v${version}` : "")})`,
    );
  }

  public async usage(): Promise<string> {
    const [commandName, args, properties, subcommands] = await Promise.all([
      this.command.commandName(),
      this.command.arguments(),
      this.command.properties(),
      this.command.subcommands(),
    ]);

    const hasOptions = args.length > 0 || properties.length > 0;

    const [_arguments, _options, _commands] = await Promise.all([
      args.length > 0
        ? `${Promise.all(args.map((arg) => (arg.required === true && arg.default === undefined ? `<${arg.name.toUpperCase()}>` : undefined))).then((list) => list.filter(Boolean).join(" "))}`
        : "",
      properties.length > 0
        ? `${await Promise.all(
            properties
              .filter((property) => property.required)
              .map((property) => property.names.join(", ")),
          )}`
        : "",
      `${await Promise.all(subcommands.map((cmd) => cmd.name())).then((list) => list.join("|"))}`,
    ]);

    return [
      `${colors.underline(colors.bold("USAGE"))}`,
      `\``,
      `${commandName}${hasOptions ? " [OPTIONS]" : ""}`,
      _arguments,
      _options,
      _commands,
      `\``,
    ].join(" ");
  }

  public async agruments(): Promise<string> {
    const args = await this.command.arguments();
    const lines: string[] = [];

    if (args.length === 0) {
      return "";
    }

    lines.push(colors.underline(colors.bold("ARGUMENTS")), "");

    const columns = await Promise.all(
      args.map((arg) => {
        const name = arg.name.toUpperCase();
        const usageHint = arg.default ? `="${arg.default}"` : "";
        return [`\`${name + usageHint}\``, arg.description || ""];
      }),
    );

    lines.push(formatLineColumns(columns, "  "));

    return lines.join("\n");
  }

  public async options(): Promise<string> {
    const properties = await this.command.properties();

    if (properties.length === 0) {
      return "";
    }

    const lines: string[] = [];

    lines.push(colors.underline(colors.bold("OPTIONS")), "");

    const columns = properties.map((arg) => {
      return [
        `\`${arg.names.join(", ")}${arg.required ? " (required)" : ""}\``,
        arg.description || "",
      ];
    });

    lines.push(formatLineColumns(columns, "  "));
    lines.push("");

    return lines.join("\n");
  }

  public async commands(): Promise<string> {
    const lines: string[] = [];
    const subcommands = await this.command.subcommands();

    if (subcommands.length === 0) {
      return "";
    }

    const commandName = await this.command.commandName();

    lines.push(colors.underline(colors.bold("COMMANDS")), "");

    const columns = await Promise.all(
      subcommands.map(async (cmd) => {
        const name = await cmd.name();
        const description = await cmd.description();
        return [`\`${name}\``, description];
      }),
    );

    lines.push(formatLineColumns(columns, "  "));
    lines.push(
      "",
      `Use \`${commandName} <command> --help\` for more information about a command.`,
    );

    return lines.join("\n");
  }

  public async toString() {
    const [description, usage, args, options, commands] = await Promise.all([
      this.description(),
      this.usage(),
      this.agruments(),
      this.options(),
      this.commands(),
    ]);

    const lines: string[] = [];

    lines.push(description, "");
    lines.push(usage, "");

    if (args) {
      lines.push(args, "");
    }

    if (options) {
      lines.push(options, "");
    }

    if (commands) {
      lines.push(commands, "");
    }

    return lines.join("\n");
  }
}

export interface IRendersUsage {
  toString(): Promise<string>;
}
