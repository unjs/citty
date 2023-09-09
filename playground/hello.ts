import consola from "consola";
import { defineCommand, createMain } from "../src";

const command = defineCommand({
  meta: {
    name: "hello",
    version: "1.0.0",
    description: "My Awesome CLI App",
  },
  args: {
    name: {
      type: "positional",
      description: "Your name",
      required: true,
    },
    friendly: {
      type: "boolean",
      description: "Use friendly greeting",
    },
  },
  run({ args }) {
    consola.log(`${args.friendly ? "Hi" : "Greetings"} ${args.name}!`);
  },
});

createMain(command)();
