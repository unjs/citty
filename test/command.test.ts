import { expect, it, describe } from "vitest";
import { defineCommand } from "../src";

describe("defineCommand", () => {
  it("returns the object passed to it", () => {
    const def = {}
    const cmd = defineCommand(def)

    expect(def).toBe(cmd);
  });
});
