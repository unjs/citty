import { afterEach, describe, expect, it, vi } from "vitest";
import { bold } from "../src/_color.ts";

const isTTY = process.stdout.isTTY;

describe("color", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    Object.defineProperty(process.stdout, "isTTY", { value: isTTY, configurable: true });
  });

  function setup(env: Record<string, string>, isTTY: boolean) {
    for (const key of ["NO_COLOR", "FORCE_COLOR", "TERM"]) {
      vi.stubEnv(key, "");
    }
    for (const [key, value] of Object.entries(env)) {
      vi.stubEnv(key, value);
    }
    Object.defineProperty(process.stdout, "isTTY", { value: isTTY, configurable: true });
  }

  it("colors output on a TTY", () => {
    setup({}, true);
    expect(bold("x")).toBe("\u001B[1mx\u001B[22m");
  });

  it("does not color output when stdout is not a TTY", () => {
    setup({}, false);
    expect(bold("x")).toBe("x");
  });

  it("respects any non-empty NO_COLOR", () => {
    setup({ NO_COLOR: "true" }, true);
    expect(bold("x")).toBe("x");
  });

  it("respects FORCE_COLOR", () => {
    setup({ FORCE_COLOR: "1" }, false);
    expect(bold("x")).toBe("\u001B[1mx\u001B[22m");
  });
});
