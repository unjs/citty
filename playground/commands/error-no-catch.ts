import { defineCommand } from "../../src";

export default defineCommand({
  meta: {
    name: "error-no-catch",
    description:
      "Throws an error to test .catch functionality, does not have error handling",
  },

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
        // eslint-disable-next-line no-throw-literal
        throw "Not an error!";
      }
      case "empty": {
        console.log("Throw undefined");
        // we intentionally are throwing something invalid for testing purposes
        // eslint-disable-next-line no-throw-literal
        throw undefined;
      }
      default: {
        console.log("Throw Error");
        throw new Error("Error!");
      }
    }
  },
});
