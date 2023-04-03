import boxen from "boxen";
import defu from "defu";
import { bgRed, red, bold, green, magenta } from "colorette";
import type { CommandDef } from "./types";
import { resolveSubCommand, runCommand } from "./command";
import { CLIError, resolveValue } from "./_utils";
import { showUsage } from "./usage";
import { checkPkgVersion, isPkgOutdated } from "./_registry";

export interface RunMainOptions {
  rawArgs?: string[];
}

export async function runMain(cmd: CommandDef, opts: RunMainOptions = {}) {
  const rawArgs = opts.rawArgs || process.argv.slice(2);
  try {
    const cmdMeta = defu(await resolveValue(cmd.meta || {}), {
      updateChecker: {
        registryName: undefined,
        msg: `Update available! ${red(bold("{current}"))} → ${bold(
          green("{latest}")
        )}.\n\nRun "${bold(magenta("npm install -g {cmd}"))}" to update.`,
        box: {
          padding: 1,
          textAlignment: "center",
          borderStyle: "round",
          borderColor: "yellowBright",
        },
      },
    });

    // Check for updates
    const updateCOpts = cmdMeta.updateChecker;
    const registryName =
      typeof updateCOpts === "object"
        ? updateCOpts?.registryName || cmdMeta.name
        : false;

    if (registryName && updateCOpts) {
      const pkgVer = await checkPkgVersion(registryName);
      const isOutdated = isPkgOutdated(pkgVer);

      if (isOutdated && pkgVer.current && pkgVer.latest) {
        // Format message
        const msg = updateCOpts.msg
          .replace(/{cmd}/g, registryName)
          .replace(/{current}/g, pkgVer.current)
          .replace(/{latest}/g, pkgVer.latest);

        console.log(boxen(msg, updateCOpts.box as any) + "\n");
      }
    }
    // End of update check

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
