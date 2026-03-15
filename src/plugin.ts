import type { CittyPlugin, Resolvable } from "./types.ts";
import { resolveValue } from "./_utils.ts";

export function defineCittyPlugin(plugin: Resolvable<CittyPlugin>): Resolvable<CittyPlugin> {
  return plugin;
}

export async function resolvePlugins(plugins: Resolvable<CittyPlugin>[]): Promise<CittyPlugin[]> {
  return Promise.all(plugins.map((p) => resolveValue(p)));
}
