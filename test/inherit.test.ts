import { describe, expect, it, vi } from "vitest";
import { defineCommand, runCommand } from "../src/index.ts";

describe("inherited args", () => {
  it("should forward a parent arg declared before the sub command name", async () => {
    const run = vi.fn();
    const dev = defineCommand({
      meta: { name: "dev" },
      args: { cwd: { type: "string", default: "." } },
      run,
    });
    const main = defineCommand({
      meta: { name: "nuxt" },
      args: {
        cwd: { type: "string", default: ".", inherit: true },
        command: { type: "positional", required: false },
      },
      subCommands: { dev },
    });

    await runCommand(main, { rawArgs: ["--cwd", "playground", "dev"] });

    expect(run.mock.calls[0]![0].args.cwd).toBe("playground");
    expect(run.mock.calls[0]![0].rawArgs).toEqual(["--cwd", "playground"]);
  });

  it("should not forward args without `inherit`", async () => {
    const run = vi.fn();
    const dev = defineCommand({
      args: { cwd: { type: "string", default: "." } },
      run,
    });
    const main = defineCommand({
      args: {
        cwd: { type: "string", default: "." },
        command: { type: "positional", required: false },
      },
      subCommands: { dev },
    });

    await runCommand(main, { rawArgs: ["--cwd", "playground", "dev"] });

    expect(run.mock.calls[0]![0].args.cwd).toBe(".");
    expect(run.mock.calls[0]![0].rawArgs).toEqual([]);
  });

  it("should make inherited args available to sub commands that do not declare them", async () => {
    const run = vi.fn();
    const dev = defineCommand({ run });
    const main = defineCommand({
      args: { cwd: { type: "string", inherit: true } },
      subCommands: { dev },
    });

    await runCommand(main, { rawArgs: ["--cwd", "playground", "dev"] });

    expect(run.mock.calls[0]![0].args.cwd).toBe("playground");
    expect(run.mock.calls[0]![0].args._).toEqual([]);
  });

  it("should support boolean, enum, alias and `=` forms", async () => {
    const run = vi.fn();
    const dev = defineCommand({ run });
    const main = defineCommand({
      args: {
        verbose: { type: "boolean", inherit: true },
        logLevel: { type: "enum", options: ["info", "warn"], alias: "l", inherit: true },
        cwd: { type: "string", inherit: true },
      },
      subCommands: { dev },
    });

    await runCommand(main, {
      rawArgs: ["--verbose", "-l", "warn", "--cwd=playground", "dev"],
    });

    const { args, rawArgs } = run.mock.calls[0]![0];
    expect(args.verbose).toBe(true);
    expect(args.logLevel).toBe("warn");
    expect(args.cwd).toBe("playground");
    expect(rawArgs).toEqual(["--verbose", "-l", "warn", "--cwd=playground"]);
  });

  it("should let a value passed after the sub command name win", async () => {
    const run = vi.fn();
    const dev = defineCommand({
      args: { cwd: { type: "string", default: "." } },
      run,
    });
    const main = defineCommand({
      args: { cwd: { type: "string", default: ".", inherit: true } },
      subCommands: { dev },
    });

    await runCommand(main, { rawArgs: ["--cwd", "parent", "dev", "--cwd", "child"] });

    expect(run.mock.calls[0]![0].args.cwd).toBe("child");
  });

  it("should let the sub command's own definition win", async () => {
    const run = vi.fn();
    const dev = defineCommand({
      args: { mode: { type: "string", default: "dev" } },
      run,
    });
    const main = defineCommand({
      args: { mode: { type: "enum", options: ["a", "b"], default: "a", inherit: true } },
      subCommands: { dev },
    });

    await runCommand(main, { rawArgs: ["dev"] });

    expect(run.mock.calls[0]![0].args.mode).toBe("dev");
  });

  it("should not apply the parent default over an explicit sub command value", async () => {
    const run = vi.fn();
    const dev = defineCommand({ run });
    const main = defineCommand({
      args: { cwd: { type: "string", default: ".", inherit: true } },
      subCommands: { dev },
    });

    await runCommand(main, { rawArgs: ["dev", "--cwd", "playground"] });

    expect(run.mock.calls[0]![0].args.cwd).toBe("playground");
  });

  it("should not consume a parent positional", async () => {
    const run = vi.fn();
    const dev = defineCommand({ run });
    const main = defineCommand({
      args: {
        cwd: { type: "string", inherit: true },
        command: { type: "positional", required: false },
      },
      subCommands: { dev },
    });

    await runCommand(main, { rawArgs: ["--cwd", "playground", "dev", "extra"] });

    expect(run.mock.calls[0]![0].args._).toEqual(["extra"]);
  });

  it("should leave `--` passthrough untouched", async () => {
    const run = vi.fn();
    const dev = defineCommand({ run });
    const main = defineCommand({
      args: { cwd: { type: "string", inherit: true } },
      subCommands: { dev },
    });

    await runCommand(main, {
      rawArgs: ["--cwd", "playground", "dev", "--", "--cwd", "raw"],
    });

    const { args, rawArgs } = run.mock.calls[0]![0];
    expect(rawArgs).toEqual(["--cwd", "playground", "--", "--cwd", "raw"]);
    expect(args.cwd).toBe("playground");
  });

  it("should compose across nested sub commands", async () => {
    const run = vi.fn();
    const add = defineCommand({ run });
    const module_ = defineCommand({ subCommands: { add } });
    const main = defineCommand({
      args: { cwd: { type: "string", inherit: true } },
      subCommands: { module: module_ },
    });

    await runCommand(main, { rawArgs: ["--cwd", "playground", "module", "add", "nuxt-og-image"] });

    const { args, rawArgs } = run.mock.calls[0]![0];
    expect(args.cwd).toBe("playground");
    expect(rawArgs).toEqual(["--cwd", "playground", "nuxt-og-image"]);
  });

  it("should forward inherited args to a default sub command", async () => {
    const run = vi.fn();
    const dev = defineCommand({ run });
    const main = defineCommand({
      args: { cwd: { type: "string", inherit: true } },
      subCommands: { dev },
      default: "dev",
    });

    await runCommand(main, { rawArgs: ["--cwd", "playground"] });

    expect(run.mock.calls[0]![0].args.cwd).toBe("playground");
  });
});
