import consola from 'consola'
import { defineCommand } from "citty";
import { createMain } from 'citty/main';

const main = defineCommand({
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

const run = createMain(main);

run()
// run()
