import { run } from "node:test";
import { defineCommand, runMain } from "citty";

const log = defineCommand({
  meta: {
    name: "log",
    description: "Log a message",
  },
  run() {
    console.log("Log");
  }
});

const main = defineCommand({
  meta: {
    name: "cleanup",
    description: "Cleanup your command after running it",
  },
  // Run after main or sub commands
  cleanup(ctx) {
    console.log("Cleanup", ctx); // Access to args, meta, etc.
  },
  // subCommands: {
  //   log,
  // },
  run() {
    console.log("Main");
  }
})

runMain(main);
