import { defineCommand } from "../../src";

export default defineCommand({
  meta: {
    name: "deploy",
    description: "Deploy the bundle output to the cloud.",
  },
  args: {
    exclude: {
      type: "string",
      valueHint: "PATTERNS",
      description: "Exclude files that match this pattern",
    },
    include: {
      type: "string",
      valueHint: "PATTERNS",
      description: "Only upload files that match this pattern",
    },
    importMap: {
      type: "string",
      valueHint: "FILE",
      description: "Use import map file",
    },
    static: {
      type: "boolean",
      description: "Don't include the files in the CWD as static files",
      default: false,
    },
    prod: {
      type: "boolean",
      description:
        "Create a production deployment (default is preview deployment)",
    },
    project: {
      type: "string",
      alias: "p",
      valueHint: "NAME",
      description: "The project to deploy to",
    },
    token: {
      type: "string",
      valueHint: "TOKEN",
      description: "The API token to use (defaults to DEPLOY_TOKEN env var)",
    },
    dryRun: {
      type: "boolean",
      description: "Dry run the deployment process",
    },
    outputDir: {
      type: "positional",
      description: "Path to the build output directory",
      default: ".output",
    },
  },
  run({ args }) {
    console.log("Build");
    console.log("Parsed args:", args);
  },
});
