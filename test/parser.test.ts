import { parseRawArgs } from "../src/_parser";
import { describe, it, expect } from "vitest";

describe("parseRawArgs", () => {
  it("parses arguments correctly", () => {
    const args = ["--name", "John", "--age", "30"];
    const opts = { boolean: ["age"] };
    const result = parseRawArgs(args, opts);

    expect(result).toEqual({
      _: [30],
      name: "John",
      age: true,
    });
  });

  it("handles unknown options", () => {
    const args = ["--unknown", "value"];
    const opts = { unknown: () => false };
    const result = parseRawArgs(args, opts);

    expect(result).toEqual(false);
  });

  it("handles default values", () => {
    const args = [];
    const opts = { default: { name: "Default" } };
    const result = parseRawArgs(args, opts);

    expect(result).toEqual({
      _: [],
      name: "Default",
    });
  });

  it("handles aliases", () => {
    const args = ["-n", "John"];
    const opts = { alias: { n: "name" } };
    const result = parseRawArgs(args, opts);

    expect(result).toEqual({
      _: [],
      n: "John",
      name: "John",
    });
  });

  it("handles boolean flags", () => {
    const args = ["--flag"];
    const opts = { boolean: ["flag"] };
    const result = parseRawArgs(args, opts);

    expect(result).toEqual({
      _: [],
      flag: true,
    });
  });

  it("handles string flags", () => {
    const args = ["--name", "John"];
    const opts = { string: ["name"] };
    const result = parseRawArgs(args, opts);

    expect(result).toEqual({
      _: [],
      name: "John",
    });
  });

  it("handles mixed flags", () => {
    const args = ["--name", "John", "--age", "30"];
    const opts = { string: ["name"], boolean: ["age"] };
    const result = parseRawArgs(args, opts);

    expect(result).toEqual({
      _: [30],
      name: "John",
      age: true,
    });
  });

  it("handles empty arguments", () => {
    const args = [];
    const opts = {};
    const result = parseRawArgs(args, opts);

    expect(result).toEqual({
      _: [],
    });
  });

  it("handles arguments with no values", () => {
    const args = ["--name", "--age"];
    const opts = { string: ["name"], number: ["age"] };
    const result = parseRawArgs(args, opts);

    expect("name" in result).toBeTruthy();
    expect("age" in result).toBeTruthy();

    expect(result.name).toBeUndefined();
    expect(result.age).toBeUndefined();
  });
});
