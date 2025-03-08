import { describe, it, expect } from "vitest";
import {
  toArray,
  formatLineColumns,
  resolveValue,
  CLIError,
} from "../src/_utils";
import type { Resolvable } from "../src/types";

describe("toArray()", () => {
  it.concurrent("should return empty array if input is undefined", () => {
    expect(toArray(undefined)).toEqual([]);
  });

  it.concurrent("should return the same array if input is an array", () => {
    expect(toArray([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it.concurrent(
    "should return an array containing the input if it is not an array",
    () => {
      expect(toArray(1)).toEqual([1]);
      expect(toArray("hello")).toEqual(["hello"]);
    },
  );
});
describe("formatLineColumns()", () => {
  it.concurrent("should format lines correctly", () => {
    const lines = [
      ["Name", "Age"],
      ["Alice", "30"],
      ["Bob", "40"],
    ];
    const result = formatLineColumns(lines);
    expect(result).toBe(" Name  Age\nAlice  30 \n  Bob  40 ");
  });

  it.concurrent("should prepend a line prefix if provided", () => {
    const lines = [
      ["Name", "Age"],
      ["Alice", "30"],
      ["Bob", "40"],
    ];
    const result = formatLineColumns(lines, "--");
    expect(result).toBe("-- Name  --Age\n--Alice  --30 \n--  Bob  --40 ");
  });
});

describe("resolveValue()", () => {
  it("should resolve a non-function value correctly", () => {
    const value: Resolvable<number> = 42;
    const result = resolveValue(value);
    expect(result).toBe(42);
  });

  it("should resolve a function value correctly", () => {
    const value: Resolvable<number> = () => 42;
    const result = resolveValue(value);
    expect(result).toBe(42);
  });
});

describe("CLIError", () => {
  it("should correctly create an instance with a message", () => {
    const error = new CLIError("An error occurred");
    expect(error.message).toBe("An error occurred");
    expect(error.name).toBe("CLIError");
    expect(error.code).toBeUndefined();
  });

  it("should correctly create an instance with a message and code", () => {
    const error = new CLIError("An error occurred", "ERROR_CODE");
    expect(error.message).toBe("An error occurred");
    expect(error.name).toBe("CLIError");
    expect(error.code).toBe("ERROR_CODE");
  });
});
