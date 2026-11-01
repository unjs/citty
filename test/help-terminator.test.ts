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
