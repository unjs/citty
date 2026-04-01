import { describe, it, expect, vi, afterAll } from "vitest";
import { createMain, defineCommand, renderUsage, runMain, showUsage } from "../src/index.ts";
import * as commandModule from "../src/command.ts";

describe("runMain", () => {
  vi.spyOn(process, "exit").mockImplementation(() => 0 as never);

  const consoleMock = vi.spyOn(console, "log").mockImplementation(() => undefined);

  const consoleErrorMock = vi.spyOn(console, "error").mockImplementation(() => undefined);

  afterAll(() => {
    consoleMock.mockReset();
  });

  it("shows version with flag `--version`", async () => {
    const command = defineCommand({
      meta: {
        version: "1.0.0",
      },
    });

    await runMain(command, { rawArgs: ["--version"] });

    expect(consoleMock).toHaveBeenCalledWith("1.0.0");
  });

  it("shows version with flag `--version` with meta specified as async function", async () => {
    const command = defineCommand({
      // eslint-disable-next-line unicorn/no-useless-promise-resolve-reject
      meta: async () => Promise.resolve({ version: "1.0.0" }),
    });

    await runMain(command, { rawArgs: ["--version"] });

    expect(consoleMock).toHaveBeenCalledWith("1.0.0");
  });

  it("shows usage with flag `--version` but without version specified", async () => {
    const command = defineCommand({
      meta: {
        name: "test",
        description: "Test command",
      },
    });

    await runMain(command, { rawArgs: ["--version"] });

    const usage = await renderUsage(command);
    expect(consoleMock).toHaveBeenCalledWith(usage + "\n");
    expect(consoleErrorMock).toHaveBeenCalledWith("No version specified");
  });

  it.each([["--help"], ["-h"]])("shows usage with flag `%s`", async (flag) => {
    const command = defineCommand({
      meta: {
        name: "test",
        description: "Test command",
      },
    });

    await runMain(command, { rawArgs: [flag] });

    const usage = await renderUsage(command);
    expect(consoleMock).toHaveBeenCalledWith(usage + "\n");
  });

  it.each([["--help"], ["-h"]])("can show custom usage with flag `%s`", async (flag) => {
    const command = defineCommand({
      meta: {
        name: "test",
        description: "Test command",
      },
    });

    const customUsage: typeof showUsage = async () => {
      console.log("Custom usage");
    };

    await runMain(command, { rawArgs: [flag], showUsage: customUsage });

    expect(consoleMock).toHaveBeenCalledWith("Custom usage");
  });

  it("runs the command", async () => {
    const mockRunCommand = vi.spyOn(commandModule, "runCommand");

    const command = defineCommand({});

    await runMain(command);

    expect(mockRunCommand).toHaveBeenCalledWith(command, { rawArgs: [] });
  });

  it("runs the command with raw arguments", async () => {
    const mockRunCommand = vi.spyOn(commandModule, "runCommand");

    const command = defineCommand({});

    const rawArgs = ["--foo", "bar"];

    await runMain(command, { rawArgs });

    expect(mockRunCommand).toHaveBeenCalledWith(command, { rawArgs });
  });
});

describe("sub command", () => {
  it("runs the sub command", async () => {
    const setupMock = vi.fn();
    const runMock = vi.fn();
    const cleanupMock = vi.fn();

    const command = defineCommand({
      subCommands: {
        foo: {
          args: {
            bar: {
              type: "positional",
            },
          },
          setup: async ({ args }) => {
            setupMock(args.bar);
          },
          cleanup: async ({ args }) => {
            cleanupMock(args.bar);
          },
          run: async ({ args }) => {
            runMock(args.bar);
          },
        },
      },
    });

    await runMain(command, { rawArgs: ["foo", "bar"] });

    expect(setupMock).toHaveBeenCalledOnce();
    expect(setupMock).toHaveBeenCalledWith("bar");
    expect(runMock).toHaveBeenCalledOnce();
    expect(runMock).toHaveBeenCalledWith("bar");
    expect(cleanupMock).toHaveBeenCalledOnce();
    expect(cleanupMock).toHaveBeenCalledWith("bar");
  });
});

describe("sub command aliases", () => {
  it("resolves subcommand by single alias", async () => {
    const runMock = vi.fn();

    const command = defineCommand({
      subCommands: {
        install: {
          meta: { alias: "i" },
          run: async () => {
            runMock();
          },
        },
      },
    });

    await runMain(command, { rawArgs: ["i"] });

    expect(runMock).toHaveBeenCalledOnce();
  });

  it("resolves subcommand by array of aliases", async () => {
    const runMock = vi.fn();

    const command = defineCommand({
      subCommands: {
        install: {
          meta: { alias: ["i", "add"] },
          run: async () => {
            runMock();
          },
        },
      },
    });

    await runMain(command, { rawArgs: ["add"] });

    expect(runMock).toHaveBeenCalledOnce();
  });

  it("resolves nested subcommand aliases", async () => {
    const runMock = vi.fn();

    const command = defineCommand({
      subCommands: {
        workspace: {
          meta: { alias: "ws" },
          subCommands: {
            list: {
              meta: { alias: "ls" },
              run: async () => {
                runMock();
              },
            },
          },
        },
      },
    });

    await runMain(command, { rawArgs: ["ws", "ls"] });

    expect(runMock).toHaveBeenCalledOnce();
  });

  it("prefers direct key match over alias", async () => {
    const directMock = vi.fn();
    const aliasMock = vi.fn();

    const command = defineCommand({
      subCommands: {
        i: {
          run: async () => {
            directMock();
          },
        },
        install: {
          meta: { alias: "i" },
          run: async () => {
            aliasMock();
          },
        },
      },
    });

    await runMain(command, { rawArgs: ["i"] });

    expect(directMock).toHaveBeenCalledOnce();
    expect(aliasMock).not.toHaveBeenCalled();
  });

  it("throws for unknown command even with aliases defined", async () => {
    const command = defineCommand({
      subCommands: {
        install: {
          meta: { alias: "i" },
          run: async () => {},
        },
      },
    });

    await expect(commandModule.runCommand(command, { rawArgs: ["unknown"] })).rejects.toThrow(
      "Unknown command",
    );
  });

  it("shows aliases in usage output", async () => {
    const command = defineCommand({
      meta: { name: "cli", description: "Test CLI" },
      subCommands: {
        install: {
          meta: { name: "install", alias: ["i", "add"], description: "Install packages" },
        },
        build: {
          meta: { name: "build", alias: "b", description: "Build project" },
        },
      },
    });

    const usage = await renderUsage(command);
    expect(usage).toContain("install, i, add");
    expect(usage).toContain("build, b");
  });
});

describe("sub command with parent args", () => {
  it("resolves subcommand when parent has string arg", async () => {
    const runMock = vi.fn();

    const command = defineCommand({
      args: {
        name: { type: "string" },
      },
      subCommands: {
        build: {
          run: async () => {
            runMock();
          },
        },
      },
    });

    await runMain(command, { rawArgs: ["--name", "Citty", "build"] });

    expect(runMock).toHaveBeenCalledOnce();
  });

  it("resolves subcommand when parent has string arg with = syntax", async () => {
    const runMock = vi.fn();

    const command = defineCommand({
      args: {
        name: { type: "string" },
      },
      subCommands: {
        build: {
          run: async () => {
            runMock();
          },
        },
      },
    });

    await runMain(command, { rawArgs: ["--name=Citty", "build"] });

    expect(runMock).toHaveBeenCalledOnce();
  });

  it("resolves subcommand when parent has string arg with alias", async () => {
    const runMock = vi.fn();

    const command = defineCommand({
      args: {
        name: { type: "string", alias: "n" },
      },
      subCommands: {
        build: {
          run: async () => {
            runMock();
          },
        },
      },
    });

    await runMain(command, { rawArgs: ["-n", "Citty", "build"] });

    expect(runMock).toHaveBeenCalledOnce();
  });

  it("resolves subcommand when parent has enum arg", async () => {
    const runMock = vi.fn();

    const command = defineCommand({
      args: {
        env: { type: "enum", options: ["dev", "prod"] },
      },
      subCommands: {
        build: {
          run: async () => {
            runMock();
          },
        },
      },
    });

    await runMain(command, { rawArgs: ["--env", "prod", "build"] });

    expect(runMock).toHaveBeenCalledOnce();
  });

  it("boolean arg does not consume next token as value", async () => {
    const runMock = vi.fn();

    const command = defineCommand({
      args: {
        verbose: { type: "boolean" },
      },
      subCommands: {
        build: {
          run: async () => {
            runMock();
          },
        },
      },
    });

    await runMain(command, { rawArgs: ["--verbose", "build"] });

    expect(runMock).toHaveBeenCalledOnce();
  });
});

describe("resolveSubCommand", () => {
  it("resolves subcommand with parent string args", async () => {
    const command = defineCommand({
      args: {
        name: { type: "string" },
      },
      subCommands: {
        build: {
          args: {
            target: { type: "positional" },
          },
        },
      },
    });

    const [subCommand] = await commandModule.resolveSubCommand(command, [
      "--name",
      "Citty",
      "build",
      "prod",
    ]);

    expect(subCommand).toBeDefined();
    expect(subCommand.args).toEqual({
      target: { type: "positional" },
    });
  });

  it("resolves the sub command", async () => {
    const command = defineCommand({
      subCommands: {
        foo: {
          args: {
            bar: {
              type: "positional",
            },
          },
        },
      },
    });

    const [subCommand] = await commandModule.resolveSubCommand(command, ["foo", "bar"]);

    expect(subCommand).toBeDefined();
    expect(subCommand.args).toEqual({
      bar: { type: "positional" },
    });
  });
});

describe("default sub command", () => {
  vi.spyOn(process, "exit").mockImplementation(() => 0 as never);

  it("runs default sub command when no args provided", async () => {
    const runMock = vi.fn();

    const command = defineCommand({
      default: "dev",
      subCommands: {
        dev: {
          run: async () => {
            runMock("dev");
          },
        },
        build: {
          run: async () => {
            runMock("build");
          },
        },
      },
    });

    await runMain(command, { rawArgs: [] });

    expect(runMock).toHaveBeenCalledOnce();
    expect(runMock).toHaveBeenCalledWith("dev");
  });

  it("runs explicit sub command even when default is set", async () => {
    const runMock = vi.fn();

    const command = defineCommand({
      default: "dev",
      subCommands: {
        dev: {
          run: async () => {
            runMock("dev");
          },
        },
        build: {
          run: async () => {
            runMock("build");
          },
        },
      },
    });

    await runMain(command, { rawArgs: ["build"] });

    expect(runMock).toHaveBeenCalledOnce();
    expect(runMock).toHaveBeenCalledWith("build");
  });

  it("throws when both default and run are specified", async () => {
    const command = defineCommand({
      default: "dev",
      subCommands: {
        dev: {
          run: async () => {},
        },
      },
      run: async () => {},
    });

    await expect(commandModule.runCommand(command, { rawArgs: [] })).rejects.toThrow(
      /Cannot specify both 'run' and 'default'/,
    );
  });

  it("throws when default references a non-existent sub command", async () => {
    const command = defineCommand({
      default: "missing",
      subCommands: {
        dev: {
          run: async () => {},
        },
      },
    });

    await expect(commandModule.runCommand(command, { rawArgs: [] })).rejects.toThrow(
      /Default sub command .* not found in subCommands/,
    );
  });

  it("passes remaining args to default sub command", async () => {
    const runMock = vi.fn();

    const command = defineCommand({
      default: "dev",
      subCommands: {
        dev: {
          args: {
            verbose: { type: "boolean" },
          },
          run: async ({ args }) => {
            runMock(args);
          },
        },
      },
    });

    await runMain(command, { rawArgs: ["--verbose"] });

    expect(runMock).toHaveBeenCalledOnce();
    expect(runMock).toHaveBeenCalledWith(expect.objectContaining({ verbose: true }));
  });
});

describe("builtin flag conflicts", () => {
  vi.spyOn(process, "exit").mockImplementation(() => 0 as never);

  const runMock = vi.fn();

  // -- help --

  it("allows -h alias to be used by user args (e.g. --host)", async () => {
    const command = defineCommand({
      args: {
        host: {
          type: "string",
          alias: "h",
          description: "Host to bind",
        },
      },
      run: ({ args }) => {
        runMock(args.host);
      },
    });

    await runMain(command, { rawArgs: ["-h", "localhost"] });

    expect(runMock).toHaveBeenCalledWith("localhost");
  });

  it("still supports --help when -h is taken by user args", async () => {
    const consoleMock = vi.spyOn(console, "log").mockImplementation(() => undefined);

    const command = defineCommand({
      meta: { name: "test", description: "Test" },
      args: {
        host: {
          type: "string",
          alias: "h",
        },
      },
    });

    await runMain(command, { rawArgs: ["--help"] });

    const usage = await renderUsage(command);
    expect(consoleMock).toHaveBeenCalledWith(usage + "\n");
    consoleMock.mockRestore();
  });

  it("disables builtin help when user defines --help arg", async () => {
    const command = defineCommand({
      args: {
        help: {
          type: "boolean",
          description: "Custom help",
        },
      },
      run: ({ args }) => {
        runMock(args.help);
      },
    });

    await runMain(command, { rawArgs: ["--help"] });

    expect(runMock).toHaveBeenCalledWith(true);
  });

  // -- version --

  it("allows -v alias to be used by user args (e.g. --verbose)", async () => {
    const command = defineCommand({
      meta: { version: "1.0.0" },
      args: {
        verbose: {
          type: "boolean",
          alias: "v",
          description: "Verbose output",
        },
      },
      run: ({ args }) => {
        runMock(args.verbose);
      },
    });

    await runMain(command, { rawArgs: ["-v"] });

    expect(runMock).toHaveBeenCalledWith(true);
  });

  it("still supports --version when -v is taken by user args", async () => {
    const consoleMock = vi.spyOn(console, "log").mockImplementation(() => undefined);

    const command = defineCommand({
      meta: { version: "1.0.0" },
      args: {
        verbose: {
          type: "boolean",
          alias: "v",
        },
      },
    });

    await runMain(command, { rawArgs: ["--version"] });

    expect(consoleMock).toHaveBeenCalledWith("1.0.0");
    consoleMock.mockRestore();
  });

  it("disables builtin version when user defines --version arg", async () => {
    const command = defineCommand({
      meta: { version: "1.0.0" },
      args: {
        version: {
          type: "boolean",
          description: "Custom version",
        },
      },
      run: ({ args }) => {
        runMock(args.version);
      },
    });

    await runMain(command, { rawArgs: ["--version"] });

    expect(runMock).toHaveBeenCalledWith(true);
  });
});

describe("createMain", () => {
  it("creates and returns a function", () => {
    const main = createMain(defineCommand({}));

    expect(main).toBeInstanceOf(Function);
  });
});
