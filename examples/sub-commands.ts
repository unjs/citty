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
    name: "sub-commands",
    description: "Example of sub-commands",
  },
  subCommands: {
    log,
  }
});

runMain(main);
