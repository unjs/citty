import { describe, it, expect, vi, afterAll } from "vitest";
import consola from "consola";
import { defineCommand, renderUsage, runMain, showUsage } from "../src";
import * as commandModule from "../src/command";

describe("runMain", () => {
  vi.spyOn(process, "exit").mockImplementation(() => 0 as never);

  const consoleMock = vi
    .spyOn(consola, "log")
    .mockImplementation(() => undefined);

  afterAll(() => {
    consoleMock.mockReset();
  });

  it("shows version with flag `--version`", async () => {
    const command = defineCommand({
      meta: {
        version: "1.0.0",
      },
      run() {
        console.log("Hello, World!");
      },
    });

    await runMain(command, { rawArgs: ["--version"] });

    expect(consoleMock).toHaveBeenCalledWith("1.0.0");
  });

  it("shows version with flag `--version` with meta specified as async function", async () => {
    const command = defineCommand({
      // eslint-disable-next-line unicorn/no-useless-promise-resolve-reject, require-await
      meta: async () => Promise.resolve({ version: "1.0.0" }),
      run() {
        console.log("Hello, World!");
      },
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
      run() {
        console.log("Hello, World!");
      },
    });

    await runMain(command, { rawArgs: ["--version"] });

    const usage = await renderUsage(command);
    expect(consoleMock).toHaveBeenCalledWith(usage + "\n");
  });

  it.each([["--help"], ["-h"]])("shows usage with flag `%s`", async (flag) => {
    const command = defineCommand({
      meta: {
        name: "test",
        description: "Test command",
      },
      run() {
        console.log("Hello, World!");
      },
    });

    await runMain(command, { rawArgs: [flag] });

    const usage = await renderUsage(command);
    expect(consoleMock).toHaveBeenCalledWith(usage + "\n");
  });

  it.each([["--help"], ["-h"]])(
    "can show custom usage with flag `%s`",
    async (flag) => {
      const command = defineCommand({
        meta: {
          name: "test",
          description: "Test command",
        },
        run() {
          console.log("Hello, World!");
        },
      });

      // eslint-disable-next-line require-await, unicorn/consistent-function-scoping
      const customUsage: typeof showUsage = async () => {
        consola.log("Custom usage");
      };

      await runMain(command, { rawArgs: [flag], showUsage: customUsage });

      expect(consoleMock).toHaveBeenCalledWith("Custom usage");
    },
  );

  it("runs the command", async () => {
    const mockRunCommand = vi.spyOn(commandModule, "runCommand");

    const command = defineCommand({
      run() {},
    });

    await runMain(command);

    expect(mockRunCommand).toHaveBeenCalledWith(command, { rawArgs: [] });
  });

  it("runs the command with raw arguments", async () => {
    const mockRunCommand = vi.spyOn(commandModule, "runCommand");

    const command = defineCommand({
      run() {},
    });

    const rawArgs = ["--foo", "bar"];

    await runMain(command, { rawArgs });

    expect(mockRunCommand).toHaveBeenCalledWith(command, { rawArgs });
  });
});
