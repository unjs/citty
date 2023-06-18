import type { Resolvable } from "./types";

export function toArray(val: any) {
  if (Array.isArray(val)) {
    return val;
  }
  return val === undefined ? [] : [val];
}

export function formatLineColumns(lines: string[][], linePrefix = "") {
  const maxLengh: number[] = [];
  for (const line of lines) {
    for (const [i, element] of line.entries()) {
      maxLengh[i] = Math.max(maxLengh[i] || 0, element.length);
    }
  }
  return lines
    .map((l) =>
      l
        .map(
          (c, i) => linePrefix + c[i === 0 ? "padStart" : "padEnd"](maxLengh[i])
        )
        .join("  ")
    )
    .join("\n");
}

export function resolveValue<T>(input: Resolvable<T>): T | Promise<T> {
  return typeof input === "function" ? (input as any)() : input;
}

export class CLIError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "CLIError";
  }
}
