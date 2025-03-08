import consola from "consola";
import { defineCommand } from "../../src";

export const error = defineCommand({
  args: {
    throwType: {
      type: "string",
    },
  },
  run({ args }) {
    switch (args.throwType) {
      case "string": {
        console.log("Throw string");
        // we intentionally are throwing something invalid for testing purposes

        throw "Not an error!";
      }
      case "empty": {
        console.log("Throw undefined");
        // we intentionally are throwing something invalid for testing purposes

        throw undefined;
      }
      default: {
        console.log("Throw Error");
        throw new Error("Error!");
      }
    }
  },
});

export const errorHandled = defineCommand({
  run() {
    throw new Error("intentional error");
  },
  onError(error) {
    consola.error(`Caught error: ${error}`);
  },
});
