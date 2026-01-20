import consola from "consola";
import { defineCommand } from "../../src/index.ts";

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
  run({ args }) {
    consola.log("Debug");
    consola.log("Parsed args:", args);
  },
});
