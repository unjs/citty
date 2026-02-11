import { describe, it, expect } from "vitest";
import { defineCommand, runCommand } from "../src/index.js";

describe("command alias", () => {
  it("should resolve subcommand by alias", async () => {
    let executed = false;
    const sub = defineCommand({
      meta: {
        name: "sub",
        alias: "s",
      },
      run: () => {
        executed = true;
      },
    });

    const root = defineCommand({
      subCommands: {
        sub,
      },
    });

    await runCommand(root, { rawArgs: ["s"] });
    expect(executed).toBe(true);
  });

  it("should resolve subcommand by alias array", async () => {
    let executed = "";
    const sub = defineCommand({
      meta: {
        name: "sub",
        alias: ["s", "alias"],
      },
      run: () => {
        executed = "sub";
      },
    });

    const root = defineCommand({
      subCommands: {
        sub,
      },
    });

    await runCommand(root, { rawArgs: ["s"] });
    expect(executed).toBe("sub");

    executed = "";
    await runCommand(root, { rawArgs: ["alias"] });
    expect(executed).toBe("sub");
  });

  it("should handle nested aliases", async () => {
    let executed = false;
    const leaf = defineCommand({
      meta: {
        name: "leaf",
        alias: "l",
      },
      run: () => {
        executed = true;
      },
    });
    const sub = defineCommand({
      meta: {
        name: "sub",
        alias: "s",
      },
      subCommands: {
        leaf,
      },
    });

    const root = defineCommand({
      subCommands: {
        sub,
      },
    });

    await runCommand(root, { rawArgs: ["s", "l"] });
    expect(executed).toBe(true);
  });
});
