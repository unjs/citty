import t, { type Command, type RootCommand } from "@bomb.sh/tab";
import { defineCommand } from "./command";
import { resolveValue } from "./_utils";
import type { ArgsDef, CommandDef, ArgDef } from "./types";

type TabCommand = Command | RootCommand;

async function registerCommand(
  cmd: CommandDef<ArgsDef>,
  tabCmd: TabCommand,
  path = "",
): Promise<void> {
  const args = await resolveValue(cmd.args);
  if (args) {
    for (const name in args) {
      const arg = args[name] as ArgDef;
      const handler = arg.complete
        ? (complete: (value: string, description: string) => void) =>
            arg.complete!(complete)
        : undefined;

      if (arg.type === "positional") {
        tabCmd.argument(name, handler, arg.required === false);
      } else {
        const alias =
          "alias" in arg && arg.alias
            ? typeof arg.alias === "string"
              ? arg.alias
              : arg.alias[0]
            : undefined;
        tabCmd.option(name, arg.description || "", handler || alias, alias);
      }
    }
  }

  const subCommands = await resolveValue(cmd.subCommands);
  if (!subCommands) return;

  for (const name in subCommands) {
    const sub = await resolveValue(subCommands[name]);
    const meta = await resolveValue(sub.meta);
    const subPath = path ? `${path} ${name}` : name;
    const subTab = t.command(subPath, meta?.description || "");
    await registerCommand(sub, subTab, subPath);
  }
}

export async function setupCompletions(
  cmd: CommandDef<ArgsDef>,
): Promise<void> {
  await registerCommand(cmd, t);

  const meta = await resolveValue(cmd.meta);
  const name = meta?.name || "cli";
  const subCommands = await resolveValue(cmd.subCommands);

  if (subCommands && !subCommands.complete) {
    subCommands.complete = defineCommand({
      meta: {
        name: "complete",
        description: "Generate shell completion scripts",
      },
      args: {
        shell: {
          type: "positional",
          description: "Shell type (zsh, bash, fish, powershell)",
          required: false,
        },
      },
      run({ rawArgs }) {
        const shell = rawArgs[0];
        if (shell === "--") {
          t.parse(rawArgs.slice(1));
        } else if (shell) {
          const exec = `${process.execPath} ${process.argv[1]}`;
          t.setup(name, exec, shell);
        }
      },
    });
  }
}
