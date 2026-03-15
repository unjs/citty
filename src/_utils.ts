import type { Resolvable } from "./types.ts";

export function toArray(val: any) {
  if (Array.isArray(val)) {
    return val;
  }
  return val === undefined ? [] : [val];
}

export function formatLineColumns(lines: string[][], linePrefix = "") {
  const maxLength: number[] = [];
  for (const line of lines) {
    for (const [i, element] of line.entries()) {
      maxLength[i] = Math.max(maxLength[i] || 0, element.length);
    }
  }
  return lines
    .map((l) =>
      l.map((c, i) => linePrefix + c[i === 0 ? "padStart" : "padEnd"](maxLength[i]!)).join("  "),
    )
    .join("\n");
}

export function resolveValue<T>(input: Resolvable<T>): T | Promise<T> {
  return typeof input === "function" ? (input as any)() : input;
}

export class CLIError extends Error {
  code: string | undefined;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "CLIError";
    this.code = code;
  }
}
