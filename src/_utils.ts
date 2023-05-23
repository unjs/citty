import type { Resolvable } from "./types";

export function toArray(val: any) {
  if (Array.isArray(val)) {
    return val;
  }
  return val !== undefined ? [val] : [];
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

const cache = new WeakMap<Function, any>()

export async function resolveValue<T>(input: Resolvable<T>): Promise<T> {
  if (typeof input === 'function') {
    let result: T = cache.get(input);
    if (!result) {
      result = await (input as any)();
      cache.set(input, result);
    }
    return result;
  }
  return input;
}

export class CLIError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "CLIError";
  }
}
