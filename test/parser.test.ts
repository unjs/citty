import { parseRawArgs } from "../src/_parser.ts";
import { describe, it, expect } from "vitest";

describe("parseRawArgs", () => {
  it("parses arguments correctly", () => {
    const result = parseRawArgs(["--name", "John", "--admin"], {
      string: ["name"],
      boolean: ["admin"],
    });

    expect(result).toEqual({
      _: [],
      name: "John",
      admin: true,
    });
  });

  it("handles default values", () => {
    const result = parseRawArgs([], { default: { name: "Default" } });

    expect(result).toEqual({
      _: [],
      name: "Default",
    });
  });

  it("handles aliases", () => {
    const result = parseRawArgs(["-n", "John"], { alias: { n: ["name"] } });

    expect(result).toEqual({
      _: [],
      n: "John",
      name: "John",
    });
  });

  it("handles boolean flags", () => {
    const result = parseRawArgs(["--flag"], { boolean: ["flag"] });

    expect(result).toEqual({
      _: [],
      flag: true,
    });
  });

  it("handles string flags", () => {
    const result = parseRawArgs(["--name", "John"], { string: ["name"] });

    expect(result).toEqual({
      _: [],
      name: "John",
    });
  });

  it("handles mixed flags", () => {
    const result = parseRawArgs(["--name", "John", "--age", "positional"], {
      string: ["name"],
      boolean: ["age"],
    });

    expect(result).toEqual({
      _: ["positional"],
      name: "John",
      age: true,
    });
  });

  it("handles empty arguments", () => {
    const result = parseRawArgs([], {});

    expect(result).toEqual({
      _: [],
    });
  });

  it("handles --no- negation on main option", () => {
    const result = parseRawArgs(["--no-verbose"], {
      boolean: ["verbose"],
      default: { verbose: true },
    });

    expect(result).toEqual({
      _: [],
      verbose: false,
    });
  });

  it("handles --no- negation on alias and propagates to main option", () => {
    const result = parseRawArgs(["--no-v"], {
      boolean: ["verbose"],
      alias: { v: ["verbose"] },
      default: { verbose: true },
    });

    expect(result).toEqual({
      _: [],
      v: false,
      verbose: false,
    });
  });

  it("handles --no- negation on main option and propagates to aliases", () => {
    const result = parseRawArgs(["--no-verbose"], {
      boolean: ["verbose"],
      alias: { v: ["verbose"] },
      default: { verbose: true },
    });

    expect(result).toEqual({
      _: [],
      v: false,
      verbose: false,
    });
  });
});
