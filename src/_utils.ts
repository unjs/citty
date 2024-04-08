import type { Resolvable } from "./types";

export function toArray(val: any) {
  if (Array.isArray(val)) {
    return val;
  }
  return val === undefined ? [] : [val];
}

export function resolveValue<T>(input: Resolvable<T>): T | Promise<T> {
  return typeof input === "function" ? (input as any)() : input;
}

export class CLIError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "CLIError";
  }
}
