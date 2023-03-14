import { bgRed } from "colorette";
import type { CommandDef } from "./types";
import { resolveSubCommand, runCommand } from "./command";
import { CLIError } from "./_utils";
import { showUsage } from "./usage";

export interface RunMainOptions {
  rawArgs?: string[];
}

export async function runMain(cmd: CommandDef, opts: RunMainOptions = {}) {
  const rawArgs = opts.rawArgs || process.argv.slice(2);
  try {
    if (rawArgs.includes("--help") || rawArgs.includes("-h")) {
      await showUsage(...(await resolveSubCommand(cmd, rawArgs)));
      process.exit(0);
    } else {
      await runCommand(cmd, { rawArgs });
    }
  } catch (error: any) {
    const isCLIError = error instanceof CLIError;
    if (!isCLIError) {
      console.error(error, "\n");
    }
    console.error(
      `\n${bgRed(` ${error.code || error.name} `)} ${error.message}\n`
    );
    if (isCLIError) {
      await showUsage(...(await resolveSubCommand(cmd, rawArgs)));
    }
    process.exit(1);
  }
}
