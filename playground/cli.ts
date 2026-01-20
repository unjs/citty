import { defineCommand, runMain } from "../src/index.ts";
import { registerTabCompletions } from "../src/tab.ts";

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
  subCommands: {
    build: () => import("./commands/build.ts").then((r) => r.default),
    deploy: () => import("./commands/deploy.ts").then((r) => r.default),
    debug: () => import("./commands/debug.ts").then((r) => r.default),
  },
});

await registerTabCompletions(main);

runMain(main);
