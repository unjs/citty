import consola from "consola";
import { colors } from "consola/utils";
import { snakeCase } from "scule";
import { formatLineColumns, resolveValue } from "./_utils";
import type { Arg, ArgsDef, CommandDef } from "./types";
import { resolveArgs } from "./args";

export async function showUsage<T extends ArgsDef = ArgsDef>(
  cmd: CommandDef<T>,
  parent?: CommandDef<T>,
) {
  try {
    consola.log((await renderUsage(cmd, parent)) + "\n");
  } catch (error) {
    consola.error(error);
  }
}

// `no` prefix matcher (kebab-case or camelCase)
const negativePrefixRe = /^no[-A-Z]/;

export async function renderUsage<T extends ArgsDef = ArgsDef>(
  cmd: CommandDef<T>,
  parent?: CommandDef<T>,
) {
  const cmdMeta = await resolveValue(cmd.meta || {});
  const cmdArgs = resolveArgs(await resolveValue(cmd.args || {}));
  const parentMeta = await resolveValue(parent?.meta || {});

  const commandName =
    `${parentMeta.name ? `${parentMeta.name} ` : ""}` +
    (cmdMeta.name || process.argv[1]);

  const argLines: string[][] = [];
  const posLines: string[][] = [];
  const commandsLines: string[][] = [];
  const usageLine = [];

  for (const arg of cmdArgs) {
    if (arg.type === "positional") {
      const name = arg.name.toUpperCase();
      const isRequired = arg.required !== false && arg.default === undefined;
      posLines.push([
        "`" + name + renderValueHint(arg) + "`",
        renderDescription(arg, isRequired),
      ]);
      usageLine.push(isRequired ? `<${name}>` : `[${name}]`);
    } else {
      const isRequired = arg.required === true && arg.default === undefined;
      const argStr =
        [...(arg.alias || []).map((a) => `-${a}`), `--${arg.name}`].join(", ") +
        renderValueHint(arg);
      argLines.push(["`" + argStr + "`", renderDescription(arg, isRequired)]);

      /**
       * print negative boolean arg variant usage when
       * - enabled by default or has `negativeDescription`
       * - not prefixed with `no-` or `no[A-Z]`
       */
      if (
        arg.type === "boolean" &&
        (arg.default === true || arg.negativeDescription) &&
        !negativePrefixRe.test(arg.name)
      ) {
        const negativeArgStr = [
          ...(arg.alias || []).map((a) => `--no-${a}`),
          `--no-${arg.name}`,
        ].join(", ");
        argLines.push([
          "`" + negativeArgStr + "`",
          [arg.negativeDescription, isRequired ? colors.gray("(Required)") : ""]
            .filter(Boolean)
            .join(" "),
        ]);
      }

      if (isRequired) {
        usageLine.push(`--${arg.name}` + renderValueHint(arg));
      }
    }
  }

  if (cmd.subCommands) {
    const commandNames: string[] = [];
    const subCommands = await resolveValue(cmd.subCommands);
    for (const [name, sub] of Object.entries(subCommands)) {
      const subCmd = await resolveValue(sub);
      const meta = await resolveValue(subCmd?.meta);
      if (meta?.hidden) {
        continue;
      }
      commandsLines.push([`\`${name}\``, meta?.description || ""]);
      commandNames.push(name);
    }
    usageLine.push(commandNames.join("|"));
  }

  const usageLines: (string | undefined)[] = [];

  const version = cmdMeta.version || parentMeta.version;

  usageLines.push(
    colors.gray(
      `${cmdMeta.description} (${
        commandName + (version ? ` v${version}` : "")
      })`,
    ),
    "",
  );

  const hasOptions = argLines.length > 0 || posLines.length > 0;
  usageLines.push(
    `${colors.underline(colors.bold("USAGE"))} \`${commandName}${
      hasOptions ? " [OPTIONS]" : ""
    } ${usageLine.join(" ")}\``,
    "",
  );

  if (posLines.length > 0) {
    usageLines.push(colors.underline(colors.bold("ARGUMENTS")), "");
    usageLines.push(formatLineColumns(posLines, "  "));
    usageLines.push("");
  }

  if (argLines.length > 0) {
    usageLines.push(colors.underline(colors.bold("OPTIONS")), "");
    usageLines.push(formatLineColumns(argLines, "  "));
    usageLines.push("");
  }

  if (commandsLines.length > 0) {
    usageLines.push(colors.underline(colors.bold("COMMANDS")), "");
    usageLines.push(formatLineColumns(commandsLines, "  "));
    usageLines.push(
      "",
      `Use \`${commandName} <command> --help\` for more information about a command.`,
    );
  }

  return usageLines.filter((l) => typeof l === "string").join("\n");
}

function renderValueHint(arg: Arg) {
  const valueHint = arg.valueHint ? `=<${arg.valueHint}>` : "";
  const fallbackValueHint = valueHint || `=<${snakeCase(arg.name)}>`;

  if (!arg.type || arg.type === "positional" || arg.type === "boolean") {
    return valueHint;
  }

  if (arg.type === "enum" && arg.options?.length) {
    return `=<${arg.options.join("|")}>`;
  }

  return fallbackValueHint;
}

function renderDescription(arg: Arg, required: boolean) {
  const requiredHint = required ? colors.gray("(Required)") : "";
  const defaultHint =
    arg.default === undefined ? "" : colors.gray(`(Default: ${arg.default})`);
  const description = [arg.description, requiredHint, defaultHint]
    .filter(Boolean)
    .join(" ");

  return description;
}
