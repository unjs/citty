import { expect, it, describe } from "vitest";
import { main } from "../playground/cli";
import { runCommand } from "../src/command";

describe("citty", () => {
  it.todo("pass", () => {
    expect(true).toBe(true);
  });

  describe("commands", () => {
    describe("error", () => {
      it("should catch thrown errors when present", () => {
        expect(() =>
          runCommand(main, { rawArgs: ["error"] }),
        ).not.toThrowError();
      });
      it("should still receive an error when a string is thrown from the command", () =>
        expect(
          runCommand(main, {
            rawArgs: ["error-no-catch", "--throwType", "string"],
          }),
        ).rejects.toThrowError());
      it("should still receive an error when undefined is thrown from the command", () =>
        expect(
          runCommand(main, {
            rawArgs: ["error-no-catch", "--throwType", "empty"],
          }),
        ).rejects.toThrowError());

      it("should not interfere with default error handling when not present", () =>
        expect(() =>
          runCommand(main, { rawArgs: ["error-no-catch"] }),
        ).rejects.toBeInstanceOf(Error));
    });
  });
});
