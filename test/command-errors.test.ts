import { describe, expect, it, vi } from "vitest";
import { defineCommand, runCommand } from "../src/index.ts";

describe("falsy command errors", () => {
  it.each([undefined, null, false, 0, ""])("rethrows %s after cleanup", async (error) => {
    const cleanup = vi.fn();
    const command = defineCommand({
      run() {
        throw error;
      },
      cleanup,
    });
    await expect(runCommand(command, { rawArgs: [] })).rejects.toBe(error);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("preserves a falsy setup error over a cleanup error", async () => {
    const cleanup = vi.fn(() => {
      throw new Error("cleanup failed");
    });
    const command = defineCommand({
      setup() {
        throw false;
      },
      cleanup,
    });
    await expect(runCommand(command, { rawArgs: [] })).rejects.toBe(false);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
