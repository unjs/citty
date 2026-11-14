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

  it("handles --<arg>=<value>", () => {
    const result = parseRawArgs(["--name=John"], {
      string: ["name"],
    });

    expect(result).toEqual({
      _: [],
      name: "John",
    });
  });

  it.fails("handles -<arg>=<value> with alias (#237)", () => {
    const result = parseRawArgs(["-n=John"], {
      string: ["name"],
      alias: {
        n: ["name"],
      },
    });

    expect(result).toEqual({
      _: [],
      n: "John",
      name: "John",
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

  it("handles string values starting with a hyphen (#171)", () => {
    const result = parseRawArgs(["--params", "-a 192.168.1.1 -b -c"], {
      string: ["params"],
    });

    expect(result).toEqual({
      _: [],
      params: "-a 192.168.1.1 -b -c",
    });
  });

  it("handles string value that is a single hyphen-prefixed token (#171)", () => {
    const result = parseRawArgs(["--name", "-test"], {
      string: ["name"],
    });

    expect(result).toEqual({
      _: [],
      name: "-test",
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

  it("coerces --flag=true to boolean true for boolean args", () => {
    const result = parseRawArgs(["--flag=true"], { boolean: ["flag"] });
    expect(result.flag).toBe(true);
    expect(typeof result.flag).toBe("boolean");
  });

  it("coerces --flag=false to boolean false for boolean args", () => {
    const result = parseRawArgs(["--flag=false"], { boolean: ["flag"] });
    expect(result.flag).toBe(false);
    expect(typeof result.flag).toBe("boolean");
  });

  it("coerces string arg without value to empty string (not boolean true)", () => {
    const result = parseRawArgs(["--nightly"], { string: ["nightly"] });
    expect(result.nightly).toBe("");
    expect(typeof result.nightly).toBe("string");
  });

  it("preserves --no- prefixed values for string options (#296)", () => {
    expect(
      parseRawArgs(["--message", "--no-verify is bad"], {
        string: ["message"],
      }),
    ).toEqual({
      _: [],
      message: "--no-verify is bad",
    });

    expect(
      parseRawArgs(["-m", "--no-verify", "--no-verbose"], {
        string: ["message"],
        boolean: ["verbose"],
        alias: { m: ["message"] },
        default: { verbose: true },
      }),
    ).toEqual({
      _: [],
      m: "--no-verify",
      message: "--no-verify",
      verbose: false,
    });
  });

  it("handles grouped short flags, inline values, and bare - before --no- flags (#296)", () => {
    expect(
      parseRawArgs(["-vm", "--no-warnings"], {
        string: ["message"],
        boolean: ["verbose"],
        alias: { v: ["verbose"], m: ["message"] },
      }),
    ).toEqual({
      _: [],
      v: true,
      verbose: true,
      m: "--no-warnings",
      message: "--no-warnings",
    });

    expect(
      parseRawArgs(["-mfoo", "--no-verbose"], {
        string: ["message"],
        boolean: ["verbose"],
        alias: { m: ["message"] },
        default: { verbose: true },
      }),
    ).toEqual({
      _: [],
      m: "foo",
      message: "foo",
      verbose: false,
    });

    expect(
      parseRawArgs(["--message=foo", "-", "--no-verbose"], {
        string: ["message"],
        boolean: ["verbose"],
        default: { verbose: true },
      }),
    ).toEqual({
      _: ["-"],
      message: "foo",
      verbose: false,
    });

    expect(
      parseRawArgs(["--no-verbose", "--", "--no-warnings"], {
        boolean: ["verbose"],
        default: { verbose: true },
      }),
    ).toEqual({
      _: ["--no-warnings"],
      verbose: false,
    });
  });
});
