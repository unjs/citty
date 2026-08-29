import { describe, expect, it } from "vitest";
import { defineCommand } from "../src/index.ts";

describe("ParsedArgs case aliases", () => {
  it("preserves the argument type when accessed through camelCase", () => {
    const command = defineCommand({
      args: {
        "output-dir": { type: "string" },
      },
      run({ args }) {
        const outputDir: string | undefined = args.outputDir;
        const kebabOutputDir: string | undefined = args["output-dir"];

        expect([outputDir, kebabOutputDir]).toEqual([undefined, undefined]);
      },
    });

    expect(command).toBeDefined();
  });
});
