import { describe, expect, it, vi } from "vitest";
import { defineCommand, runCommand } from "../src/index.ts";

describe("subcommand own properties", () => {
  it.each(["toString", "constructor", "__proto__"])("rejects unregistered %s", async (name) => {
    const run = vi.fn();
    const command = defineCommand({ subCommands: { actual: { run } } });
    await expect(runCommand(command, { rawArgs: [name] })).rejects.toMatchObject({
      code: "E_UNKNOWN_COMMAND",
    });
    expect(run).not.toHaveBeenCalled();
  });

  it("runs a registered prototype-colliding name", async () => {
    const run = vi.fn();
    const command = defineCommand({ subCommands: { ["__proto__"]: { run } } });
    await runCommand(command, { rawArgs: ["__proto__"] });
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("resolves an alias that collides with an inherited name", async () => {
    const run = vi.fn();
    const command = defineCommand({
      subCommands: { actual: { meta: { alias: "toString" }, run } },
    });
    await runCommand(command, { rawArgs: ["toString"] });
    expect(run).toHaveBeenCalledTimes(1);
  });
});
