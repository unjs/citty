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
    name: "setup",
    description: "Setup your command before running it",
  },
  // Run before main or sub commands
  setup(ctx) {
    console.log("Setup", ctx); // Access to args, meta, etc.
  },
  subCommands: {
    log,
  }
})

runMain(main);
