import { defineCommand, runMain } from "../src";
import logPlugin from "./plugins/log";

const main = defineCommand({
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
  plugins: [logPlugin],
  subCommands: {
    build: () => import("./commands/build").then((r) => r.default),
    deploy: () => import("./commands/deploy").then((r) => r.default),
    debug: () => import("./commands/debug").then((r) => r.default),
  },
});

runMain(main);
