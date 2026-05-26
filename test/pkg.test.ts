import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { readPackageVersion } from "../src/_pkg.ts";

describe("readPackageVersion", () => {
  it("reads version from nearest package.json", () => {
    const dir = mkdtempSync(join(tmpdir(), "citty-pkg-"));
    try {
      writeFileSync(
        join(dir, "package.json"),
        JSON.stringify({ name: "test-cli", version: "2.3.4" }),
      );
      expect(readPackageVersion(dir)).toBe("2.3.4");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("walks up directories to find package.json", () => {
    const root = mkdtempSync(join(tmpdir(), "citty-pkg-root-"));
    const nested = join(root, "nested");
    try {
      mkdirSync(nested, { recursive: true });
      writeFileSync(
        join(root, "package.json"),
        JSON.stringify({ name: "test-cli", version: "9.8.7" }),
      );
      expect(readPackageVersion(nested)).toBe("9.8.7");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("returns undefined when no package.json is found", () => {
    const dir = mkdtempSync(join(tmpdir(), "citty-pkg-empty-"));
    try {
      expect(readPackageVersion(dir)).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
