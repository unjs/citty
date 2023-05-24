import { expect, it, describe } from "vitest";
import { toArray, formatLineColumns, resolveValue, CLIError } from "../src/_utils";

describe("toArray", () => {
  it("returns the passed array without doing nothing", () => {
    const passed = []
    const resolved = toArray(passed)

    expect(passed).toBe(resolved);
  });

  it("returns an array whose first element is the passed value", () => {
    expect(toArray(1)).toStrictEqual([1]);
  });

  it("returns an empty array if `undefined` is passed", () => {
    expect(toArray(undefined)).toStrictEqual([]);
  });
});

describe("formatLineColumns", () => {
  it("returns a formatted string", () => {
    expect(formatLineColumns([
      ['arg1', 'description of arg1'],
      ['arg2', 'description of arg2']
    ])).toBe(`
arg1  description of arg1
arg2  description of arg2
`.trim());
  });

  it("returns a formatted string, where each part is prefixed by second argument", () => {
    expect(formatLineColumns([
      ['arg1', 'description of arg1'],
      ['arg2', 'description of arg2']
    ], "prefix")).toBe(`
prefixarg1  prefixdescription of arg1
prefixarg2  prefixdescription of arg2
`.trim());
  });
});


describe("resolveValue", () => {
  it("returns the value passed to it", () => {
    expect(resolveValue(1)).toBe(1);
  });

  it("returns the return value of the function passed to it", () => {
    expect(resolveValue(() => 1)).toBe(1);
  });
});

describe("CLIError", () => {
  it("can be instantiated with 3 own properties", () => {
    expect(new CLIError('error message', 'fatal')).toMatchObject({
      name: 'CLIError',
      message: 'error message',
      code: 'fatal',
    });
  });
});
