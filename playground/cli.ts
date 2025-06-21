import { defineCommand, runMain } from "../src";

export const main = defineCommand({
  meta: {
    name: "citty",
    version: "1.0.0",
    description: "Citty playground CLI",
  },
  setup() {
    console.log("Setup");
  },
  cleanup() {
    console.log("Cleanup");
  },
  subCommands: {
    build: () => import("./commands/build").then((r) => r.default),
    deploy: () => import("./commands/deploy").then((r) => r.default),
    debug: () => import("./commands/debug").then((r) => r.default),
    error: () => import("./commands/error").then((r) => r.error),
    "error-handled": () =>
      import("./commands/error").then((r) => r.errorHandled),
  },
});

if (process.env.NODE_ENV !== "test") {
  runMain(main);
}
