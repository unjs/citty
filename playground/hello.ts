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
    adjective: {
      type: "enum",
      description: "Adjective to use in greeting",
      options: ["awesome", "cool", "nice"],
      default: "awesome",
      require: false,
    }
  },
  run({ args }) {
    consola.log(`${args.friendly ? "Hi" : "Greetings"} ${args.adjective} ${args.name}!`);
  },
});

createMain(command)();
