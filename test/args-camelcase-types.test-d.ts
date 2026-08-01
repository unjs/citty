import { describe, it, expectTypeOf } from "vitest";
import { parseArgs } from "../src/args.ts";
import type { ArgsDef, ParsedArgs } from "../src/types.ts";

describe("ParsedArgs camelCase/kebab-case key types", () => {
  it("camelCased accessor of a kebab-cased string arg narrows to string", () => {
    type Args = {
      "output-dir": { type: "string"; required: true };
    };
    type P = ParsedArgs<Args>;

    expectTypeOf<P["outputDir"]>().toEqualTypeOf<string>();
    expectTypeOf<P["output-dir"]>().toEqualTypeOf<string>();
  });

  it("kebab-cased accessor of a camelCased boolean arg narrows to boolean", () => {
    type Args = {
      outputDir: { type: "boolean"; default: true };
    };
    type P = ParsedArgs<Args>;

    expectTypeOf<P["outputDir"]>().toEqualTypeOf<boolean>();
    expectTypeOf<P["output-dir"]>().toEqualTypeOf<boolean>();
  });
});
