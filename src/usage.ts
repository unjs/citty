import consola from "consola";
import { colors } from "consola/utils";
import { formatLineColumns, resolveValue } from "./_utils";
import type { Arg, ArgDef, ArgsDef, CommandDef } from "./types";
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

/**
 * Formats argument string with value hints, defaults, and enum options if applicable
 * @remark Default values are only rendered for string and positional args
 */
function formatArgString(name: string, arg: ArgDef) {
  switch (arg.type) {
    case "boolean": {
      return name;
    }
    case "enum": {
      if (arg.options) {
        return `${name}=<${arg.options.join("|")}>`;
      }
      break;
    }
    case "string": {
      if (arg.valueHint) {
        return `${name}=<${arg.valueHint}>`;
      }
      // fall through (same as positional formatting)
    }
    case "positional": {
      if (arg.default != undefined) {
        return `${name}="${arg.default}"`;
      }
      break;
    }
  }

  return name;
}

// Formats and prefixes argument name + aliases (e.g. `-f, --foo`, `-no-f, --no-foo`)
function formatArgName(arg: Arg, negative: boolean = false) {
  const short = negative ? "-no-" : "-";
  const long = negative ? "--no-" : "--";
  return [
    ...(arg.alias || []).map((a: string) => short + a),
    long + arg.name,
  ].join(", ");
}

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

  const argLines: [string, string][] = [];
  const posLines: [string, string, string][] = [];
  const commandsLines: [string, string][] = [];
  const usageLine = [];

  for (const arg of cmdArgs) {
    if (arg.type === "positional") {
      const name = arg.name.toUpperCase();
      posLines.push([
        `\`${formatArgString(name, arg)}\``,
        arg.description || "",
        arg.valueHint ? `<${arg.valueHint}>` : "",
      ]);

      const isRequired = arg.required !== false && arg.default === undefined;
      usageLine.push(isRequired ? `<${name}>` : `[${name}]`);
    } else {
      const argString = formatArgString(formatArgName(arg, false), arg);
      const requiredHint =
        arg.required === true && arg.default === undefined ? " (required)" : "";

      argLines.push([`\`${argString + requiredHint}\``, arg.description || ""]);
      if (requiredHint) {
        usageLine.push(argString);
      }

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
        argLines.push([
          `\`${formatArgName(arg, true)}\``,
          arg.negativeDescription || "",
        ]);
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
