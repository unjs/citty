import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function readPackageVersion(startDir?: string): string | undefined {
  let currentDir = startDir || process.cwd();

  while (true) {
    const packageJsonPath = join(currentDir, "package.json");
    if (existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
          version?: string;
        };
        if (typeof pkg.version === "string" && pkg.version.length > 0) {
          return pkg.version;
        }
      } catch {
        // ignore invalid package.json
      }
    }

    const parentDir = resolve(currentDir, "..");
    if (parentDir === currentDir) {
      return undefined;
    }
    currentDir = parentDir;
  }
}

export function readPackageVersionFromModule(moduleUrl: string): string | undefined {
  try {
    return readPackageVersion(dirname(fileURLToPath(moduleUrl)));
  } catch {
    return undefined;
  }
}
