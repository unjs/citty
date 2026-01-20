import tab from "@bomb.sh/tab";
import { resolveValue } from "./_utils.ts";

import type { ArgsDef, CommandDef, ArgDef } from "./types.ts";
import type { Command, RootCommand } from "@bomb.sh/tab";

export type TabCommand = Command | RootCommand;

export async function registerTabCompletions(
  cmd: CommandDef<ArgsDef>,
): Promise<void> {
  await registerCommand(cmd, tab);

  const meta = await resolveValue(cmd.meta);
  const name = meta?.name || "cli";
  const subCommands = await resolveValue(cmd.subCommands);

  if (subCommands && !subCommands.complete) {
    subCommands.complete = {
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
          tab.parse(rawArgs.slice(1));
        } else if (shell) {
          const exec = `${process.execPath} ${process.argv[1]}`;
          tab.setup(name, exec, shell);
        }
      },
    } satisfies CommandDef<ArgsDef>;
  }
}

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
            ? // eslint-disable-next-line unicorn/no-nested-ternary
              typeof arg.alias === "string"
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
    if (!sub) continue;
    const meta = await resolveValue(sub.meta);
    const subPath = path ? `${path} ${name}` : name;
    const subTab = tab.command(subPath, meta?.description || "");
    await registerCommand(sub, subTab, subPath);
  }
}
