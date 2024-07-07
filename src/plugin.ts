import { CittyPlugin, Resolvable } from "./types";

/**
 * Define a Citty plugin.
 *
 * Can be a function that returns a plugin object or a plugin object.
 *
 * @example
 * ```ts
 * import { defineCittyPlugin } from "citty";
 *
 * export const myPlugin = defineCittyPlugin({
 *   name: "my-plugin",
 *   async setup() {
 *     console.log("Setting up my plugin");
 *   },
 *   async cleanup() {
 *    console.log("Cleaning up my plugin");
 *   },
 * });
 * ```
 */
export function defineCittyPlugin(
  plugin: Resolvable<CittyPlugin>,
): Resolvable<CittyPlugin> {
  return plugin;
}

/**
 * Resolve a Citty plugin since it can be a function that returns a plugin object.
 */
export const resolvePlugin = async (plugin: Resolvable<CittyPlugin>) => {
  return typeof plugin === "function" ? await plugin() : plugin;
};

/**
 * Resolve an array of Citty plugins.
 */
export const resolvePlugins = (plugins: Resolvable<CittyPlugin>[]) => {
  return Promise.all(plugins.map((plugin) => resolvePlugin(plugin)));
};
