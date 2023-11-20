import consola from "consola";
import { defineCommand } from "../../src";

export default defineCommand({
  meta: {
    name: "build",
    description: "Build the project from current directory",
  },
  args: {
    prod: {
      type: "boolean",
      description: "production mode",
      alias: "p",
    },
    bundler: {
      type: "string",
      default: "rollup",
      description: "bundler name",
    },
    hmr: {
      type: "boolean",
      description: "disable hot module replacement",
      default: true,
    },
    workDir: {
      type: "string",
      description: "working directory",
      required: true,
    },
    entry: {
      type: "positional",
      description: "path to entrypoint",
    },
    dst: {
      type: "positional",
      required: false,
      description: "path to output directory",
    },
  },
  run({ args }) {
    consola.log("Build");
    consola.log("Parsed args:", args);
  },
});
