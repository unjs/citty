import { describe, it, expect, vi } from "vitest";
import { defineCommand, runCommand } from "../src/index.ts";

describe("inherited args", () => {
  it("forwards a parent arg passed before the sub command name", async () => {
    const runMock = vi.fn();

    const command = defineCommand({
      meta: { name: "nuxt" },
      args: {
        cwd: { type: "string", default: ".", inherit: true },
        command: { type: "positional", required: false },
      },
      subCommands: {
        dev: {
          meta: { name: "dev" },
          args: { cwd: { type: "string", default: "." } },
          run: ({ args, rawArgs }) => runMock(args.cwd, rawArgs),
        },
      },
    });

    await runCommand(command, { rawArgs: ["--cwd", "playground", "dev"] });

    expect(runMock).toHaveBeenCalledWith("playground", ["--cwd", "playground"]);
  });

  it("does not forward args without `inherit`", async () => {
    const runMock = vi.fn();

    const command = defineCommand({
      args: {
        cwd: { type: "string", default: "." },
        command: { type: "positional", required: false },
      },
      subCommands: {
        dev: {
          args: { cwd: { type: "string", default: "." } },
          run: ({ args, rawArgs }) => runMock(args.cwd, rawArgs),
        },
      },
    });

    await runCommand(command, { rawArgs: ["--cwd", "playground", "dev"] });

    expect(runMock).toHaveBeenCalledWith(".", []);
  });

  it("parses inherited args for a sub command that does not declare them", async () => {
    const runMock = vi.fn();

    const command = defineCommand({
      args: { cwd: { type: "string", inherit: true } },
      subCommands: {
        dev: { run: ({ args }) => runMock(args.cwd, args._) },
      },
    });

    await runCommand(command, { rawArgs: ["--cwd", "playground", "dev"] });

    expect(runMock).toHaveBeenCalledWith("playground", []);
  });

  it("forwards boolean, alias, enum and `=` forms", async () => {
    const runMock = vi.fn();

    const command = defineCommand({
      args: {
        verbose: { type: "boolean", inherit: true },
        logLevel: { type: "enum", options: ["info", "warn"], alias: "l", inherit: true },
        cwd: { type: "string", inherit: true },
      },
      subCommands: {
        dev: {
          run: ({ args, rawArgs }) => runMock(args.verbose, args.logLevel, args.cwd, rawArgs),
        },
      },
    });

    await runCommand(command, {
      rawArgs: ["--verbose", "-l", "warn", "--cwd=playground", "dev"],
    });

    expect(runMock).toHaveBeenCalledWith(true, "warn", "playground", [
      "--verbose",
      "-l",
      "warn",
      "--cwd=playground",
    ]);
  });

  it("forwards a negated boolean without consuming the sub command name", async () => {
    const runMock = vi.fn();

    const command = defineCommand({
      args: { color: { type: "boolean", default: true, inherit: true } },
      subCommands: {
        dev: { run: ({ args }) => runMock(args.color) },
      },
    });

    await runCommand(command, { rawArgs: ["--no-color", "dev"] });

    expect(runMock).toHaveBeenCalledWith(false);
  });

  it("resolves the sub command after a negated string arg", async () => {
    const runMock = vi.fn();

    const command = defineCommand({
      args: { cwd: { type: "string", inherit: true } },
      subCommands: {
        dev: { run: () => runMock() },
      },
    });

    await runCommand(command, { rawArgs: ["--no-cwd", "dev"] });

    expect(runMock).toHaveBeenCalledOnce();
  });

  it("prefers a value passed after the sub command name", async () => {
    const runMock = vi.fn();

    const command = defineCommand({
      args: { cwd: { type: "string", default: ".", inherit: true } },
      subCommands: {
        dev: {
          args: { cwd: { type: "string", default: "." } },
          run: ({ args }) => runMock(args.cwd),
        },
      },
    });

    await runCommand(command, { rawArgs: ["--cwd", "parent", "dev", "--cwd", "child"] });

    expect(runMock).toHaveBeenCalledWith("child");
  });

  it("prefers the sub command's own definition", async () => {
    const runMock = vi.fn();

    const command = defineCommand({
      args: { mode: { type: "enum", options: ["a", "b"], default: "a", inherit: true } },
      subCommands: {
        dev: {
          args: { mode: { type: "string", default: "dev" } },
          run: ({ args }) => runMock(args.mode),
        },
      },
    });

    await runCommand(command, { rawArgs: ["dev"] });

    expect(runMock).toHaveBeenCalledWith("dev");
  });

  it("does not apply the parent default over an explicit sub command value", async () => {
    const runMock = vi.fn();

    const command = defineCommand({
      args: { cwd: { type: "string", default: ".", inherit: true } },
      subCommands: {
        dev: { run: ({ args }) => runMock(args.cwd) },
      },
    });

    await runCommand(command, { rawArgs: ["dev", "--cwd", "playground"] });

    expect(runMock).toHaveBeenCalledWith("playground");
  });

  it("does not forward parent positionals", async () => {
    const runMock = vi.fn();

    const command = defineCommand({
      args: {
        cwd: { type: "string", inherit: true },
        command: { type: "positional", required: false },
      },
      subCommands: {
        dev: { run: ({ args }) => runMock(args._) },
      },
    });

    await runCommand(command, { rawArgs: ["--cwd", "playground", "dev", "extra"] });

    expect(runMock).toHaveBeenCalledWith(["extra"]);
  });

  it("leaves `--` passthrough untouched", async () => {
    const runMock = vi.fn();

    const command = defineCommand({
      args: { cwd: { type: "string", inherit: true } },
      subCommands: {
        dev: { run: ({ args, rawArgs }) => runMock(args.cwd, rawArgs) },
      },
    });

    await runCommand(command, {
      rawArgs: ["--cwd", "playground", "dev", "--", "--cwd", "raw"],
    });

    expect(runMock).toHaveBeenCalledWith("playground", [
      "--cwd",
      "playground",
      "--",
      "--cwd",
      "raw",
    ]);
  });

  it("composes across nested sub commands", async () => {
    const runMock = vi.fn();

    const command = defineCommand({
      args: { cwd: { type: "string", inherit: true } },
      subCommands: {
        module: {
          subCommands: {
            add: { run: ({ args, rawArgs }) => runMock(args.cwd, rawArgs) },
          },
        },
      },
    });

    await runCommand(command, {
      rawArgs: ["--cwd", "playground", "module", "add", "nuxt-og-image"],
    });

    expect(runMock).toHaveBeenCalledWith("playground", ["--cwd", "playground", "nuxt-og-image"]);
  });

  it("forwards inherited args to a default sub command", async () => {
    const runMock = vi.fn();

    const command = defineCommand({
      args: { cwd: { type: "string", inherit: true } },
      subCommands: {
        dev: { run: ({ args }) => runMock(args.cwd) },
      },
      default: "dev",
    });

    await runCommand(command, { rawArgs: ["--cwd", "playground"] });

    expect(runMock).toHaveBeenCalledWith("playground");
  });
});
