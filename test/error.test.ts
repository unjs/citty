import { expect, it, describe } from "vitest";
import { main } from "../playground/cli";
import { runCommand } from "../src/command";

describe("error", () => {
  it("should catch thrown errors with onError", () => {
    expect(() =>
      runCommand(main, { rawArgs: ["error-handled"] }),
    ).not.toThrowError();
  });

  it("should still receive an error when a string is thrown from the command", () =>
    expect(
      runCommand(main, {
        rawArgs: ["error", "--throwType", "string"],
      }),
    ).rejects.toThrowError());

  it("should still receive an error when undefined is thrown from the command", () =>
    expect(
      runCommand(main, {
        rawArgs: ["error", "--throwType", "empty"],
      }),
    ).rejects.toThrowError());

  it("should not interfere with default error handling when not present", () =>
    expect(() =>
      runCommand(main, { rawArgs: ["error"] }),
    ).rejects.toBeInstanceOf(Error));
});
