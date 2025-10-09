import t from "@bomb.sh/tab";
import { defineCommand } from "./command";
import { resolveValue } from "./_utils";
import type { CommandDef } from "./types";

function addArgsToTab(args: any, target: any) {
    for (const [name, argDef] of Object.entries(args)) {
        const arg = argDef as any;
        const alias = Array.isArray(arg.alias) ? arg.alias[0] : arg.alias;
        const handler = arg.complete ? (c: any) => arg.complete(c) : undefined;

        if (arg.type === "positional") {
            target.argument(name, handler, arg.required === false);
        } else {
            target.option(name, arg.description || "", handler || alias, alias);
        }
    }
}

async function buildTabCompletions(cmd: CommandDef<any>, path = ""): Promise<void> {
    const subCommands = await resolveValue(cmd.subCommands);

    if (subCommands) {
        for (const [name, subCmdDef] of Object.entries(subCommands)) {
            const subCmd = await resolveValue(subCmdDef);
            const meta = await resolveValue(subCmd.meta);
            const cmdPath = path ? `${path} ${name}` : name;
            const tabCmd = t.command(cmdPath, meta?.description || "");

            const args = await resolveValue(subCmd.args);
            if (args) addArgsToTab(args, tabCmd);

            await buildTabCompletions(subCmd, cmdPath);
        }
    }

    if (!path) {
        const args = await resolveValue(cmd.args);
        if (args) addArgsToTab(args, t);
    }
}

export async function setupCompletions(cmd: CommandDef<any>): Promise<void> {
    await buildTabCompletions(cmd);

    const meta = await resolveValue(cmd.meta);
    const cliName = meta?.name || "cli";

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
                    const args = rawArgs.slice(1);
                    t.parse(args);
                } else if (shell) {
                    const execPath = process.execPath;
                    const scriptPath = process.argv[1];
                    const executable = `${execPath} ${scriptPath}`;
                    t.setup(cliName, executable, shell);
                }
            },
        });
    }
}

