import consola from "consola";
import { defineCittyPlugin, defineCommand } from "../../src";

const buildPlugin = defineCittyPlugin({
  name: "build",
  setup() {
    consola.info("Setting up build plugin");
  },
  cleanup() {
    consola.info("Cleaning up build plugin");
  },
});

export default defineCommand({
  meta: {
    name: "debug",
    description: "Debug the project",
    hidden: true,
  },
  args: {
    verbose: {
      type: "boolean",
      description: "Output more detailed debugging information",
    },
    feature: {
      type: "string",
      default: "database-query",
      description: "Only debug a specific function",
    },
  },
  plugins: [buildPlugin],
  run({ args }) {
    consola.log("Debug");
    consola.log("Parsed args:", args);
  },
});
