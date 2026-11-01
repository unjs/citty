import { afterEach, describe, expect, it, vi } from "vitest";
import { defineCommand, runMain } from "../src/index.ts";

afterEach(() => vi.restoreAllMocks());

describe("help after the option terminator", () => {
  for (const flag of ["--help", "-h"]) {
    it(`passes literal ${flag} to the command`, async () => {
      vi.spyOn(process, "exit").mockImplementation(() => 0 as never);
      const run = vi.fn();
      const showUsage = vi.fn();
      const command = defineCommand({
        args: { value: { type: "positional" } },
        run: ({ args }) => run(args.value),
      });
      await runMain(command, { rawArgs: ["--", flag], showUsage });
      expect(run).toHaveBeenCalledWith(flag);
      expect(showUsage).not.toHaveBeenCalled();
    });
    it(`still handles ${flag} before the terminator`, async () => {
      vi.spyOn(process, "exit").mockImplementation(() => 0 as never);
      const run = vi.fn();
      const showUsage = vi.fn();
      const command = defineCommand({ run });
      await runMain(command, { rawArgs: [flag, "--", "file"], showUsage });
      expect(showUsage).toHaveBeenCalled();
      expect(run).not.toHaveBeenCalled();
    });
  }
});

describe("help uses parsed option tokens", () => {
  const args = {
    name: { type: "string", alias: "n" },
    "output-name": { type: "string" },
    verbose: { type: "boolean", alias: "v" },
    mode: { type: "enum", options: ["--", "sample"], alias: "m" },
    value: { type: "positional", required: false },
  } satisfies import("../src/types.ts").ArgsDef;

  for (const rawArgs of [
    ["--name", "--", "--help"],
    ["-n", "--", "-h"],
    ["--outputName", "--", "--help"],
    ["--mode", "--", "--help"],
    ["-vn", "--", "--help"],
    ["--name=--", "--help"],
  ]) {
    it(`shows help when -- is a value: ${JSON.stringify(rawArgs)}`, async () => {
      vi.spyOn(process, "exit").mockImplementation(() => 0 as never);
      const run = vi.fn();
      const showUsage = vi.fn();
      await runMain(defineCommand({ args, run }), { rawArgs, showUsage });
      expect(showUsage).toHaveBeenCalled();
      expect(run).not.toHaveBeenCalled();
    });
  }

  for (const rawArgs of [
    ["--name", "sample", "--", "--help"],
    ["--name", "--", "--", "--help"],
    ["--verbose", "--", "--help"],
    ["--name", "--help"],
  ]) {
    it(`runs when help is data: ${JSON.stringify(rawArgs)}`, async () => {
      vi.spyOn(process, "exit").mockImplementation(() => 0 as never);
      const run = vi.fn();
      const showUsage = vi.fn();
      await runMain(defineCommand({ args, run }), { rawArgs, showUsage });
      expect(run).toHaveBeenCalled();
      expect(showUsage).not.toHaveBeenCalled();
    });
  }
});
