import { describe, it, expect } from "vitest";
import { parseArgs } from "../src/args.ts";
import type { ArgsDef } from "../src/types.ts";

describe("args", () => {
  it.each([
    [[], {}, { _: [] }],
    /**
     * String
     */
    [["--name", "John"], { name: { type: "string" } }, { name: "John", _: [] }],
    [[], { name: { type: "string", default: "John" } }, { name: "John", _: [] }],
    [["--name", "Jane"], { name: { type: "string", default: "John" } }, { name: "Jane", _: [] }],
    [["-n", "Jane"], { name: { type: "string", alias: "n" } }, { name: "Jane", n: "Jane", _: [] }],
    /**
     * Boolean
     */
    [["--force"], { force: { type: "boolean" } }, { force: true, _: [] }],
    [["-f"], { force: { alias: "f", type: "boolean" } }, { force: true, f: true, _: [] }],
    [[], { force: { type: "boolean", default: true } }, { force: true, _: [] }],
    [
      ["--no-force"],
      { force: { type: "boolean", negativeDescription: "force" } },
      { force: false, _: [] },
    ],
    /**
     * Positional
     */
    [
      ["subCommand"],
      { command: { type: "positional" } },
      { _: ["subCommand"], command: "subCommand" },
    ],
    [
      [],
      { command: { type: "positional", default: "subCommand" } },
      { _: [], command: "subCommand" },
    ],
    [[], { command: { type: "positional", required: false } }, { _: [] }],
    /**
     * Enum
     */
    [
      ["--value", "one"],
      { value: { type: "enum", options: ["one", "two"] } },
      { value: "one", _: [] },
    ],
    [
      ["--foo-bar", "one"],
      { fooBar: { type: "enum", options: ["one", "two"], default: "two" } },
      { fooBar: "one", "foo-bar": "one", _: [] },
    ],
    /**
     * Multiple (flags)
     */
    // zero or more: repeated values collect into an array
    [
      ["--env", "A=1", "--env", "B=2"],
      { env: { type: "string", multiple: true } },
      { env: ["A=1", "B=2"], _: [] },
    ],
    // zero or more: no values parses to an empty array (not undefined)
    [[], { env: { type: "string", multiple: true } }, { env: [], _: [] }],
    // one or more: a single value still collects into an array
    [
      ["--env", "A=1"],
      { env: { type: "string", required: true, multiple: true } },
      { env: ["A=1"], _: [] },
    ],
    // multiple enum: each value collected and validated
    [
      ["--level", "info", "--level", "warn"],
      {
        level: {
          type: "enum",
          options: ["info", "warn", "error"],
          multiple: true,
        },
      },
      { level: ["info", "warn"], _: [] },
    ],
  ] as [string[], ArgsDef, any][])(
    "should parsed correctly %o (%o)",
    (rawArgs, definition, result) => {
      const parsed = parseArgs(rawArgs, definition);

      expect(parsed).toEqual(result);
    },
  );

  it.each<[string[], ArgsDef, string]>([
    [[], { name: { type: "string", required: true } }, "Missing required argument: --name"],
    [
      [],
      {
        name: { type: "positional" },
      },
      "Missing required positional argument: NAME",
    ],
    [
      ["--value", "three"],
      { value: { type: "enum", options: ["one", "two"] } },
      "Invalid value for argument: --value (three). Expected one of: one, two.",
    ],
    // one or more: zero values fails like a missing required argument
    [
      [],
      { env: { type: "string", required: true, multiple: true } },
      "Missing required argument: --env",
    ],
    // multiple enum: an invalid value is rejected
    [
      ["--level", "trace"],
      { level: { type: "enum", options: ["info", "warn"], multiple: true } },
      "Invalid value for argument: --level (trace). Expected one of: info, warn.",
    ],
  ])("should throw error with %o (%o)", (rawArgs, definition, result) => {
    // TODO: should check for exact match
    // https://github.com/vitest-dev/vitest/discussions/6048
    expect(() => {
      parseArgs(rawArgs, definition);
    }).toThrowError(result);
  });

  it("should resolve camelCase argument", () => {
    const definition: ArgsDef = {
      "user-name": { type: "string" },
    };
    const rawArgs = ["--userName", "Jane"];

    const parsed = parseArgs(rawArgs, definition);

    expect(parsed["user-name"]).toBe("Jane");
    expect(parsed._).toEqual([]);
  });

  it("should resolve kebab-case argument", () => {
    const definition: ArgsDef = {
      userName: { type: "string" },
    };
    const rawArgs = ["--user-name", "Jane"];

    const parsed = parseArgs(rawArgs, definition);

    expect(parsed.userName).toBe("Jane");
    expect(parsed._).toEqual([]);
  });

  it("should coerce --flag=true to boolean true for boolean args", () => {
    const parsed = parseArgs(["--force=true"], { force: { type: "boolean" } });
    expect(parsed.force).toBe(true);
    expect(typeof parsed.force).toBe("boolean");
  });

  it("should coerce --flag=false to boolean false for boolean args", () => {
    const parsed = parseArgs(["--force=false"], { force: { type: "boolean" } });
    expect(parsed.force).toBe(false);
    expect(typeof parsed.force).toBe("boolean");
  });

  it("should coerce --flag=false to false even with default true", () => {
    const parsed = parseArgs(["--install=false"], {
      install: { type: "boolean", default: true },
    });
    expect(parsed.install).toBe(false);
    expect(typeof parsed.install).toBe("boolean");
  });

  it("should return empty string for string arg without value", () => {
    const parsed = parseArgs(["--nightly"], { nightly: { type: "string" } });
    expect(parsed.nightly).toBe("");
    expect(typeof parsed.nightly).toBe("string");
  });
});
