import consola from "consola";
import { defineCommand } from "../../src";

export default defineCommand({
  meta: {
    name: "error",
    description: "Throws an error to test .catch functionality",
  },

  run() {
    throw new Error("Hello World");
  },
  catch(_, e) {
    consola.error(`Caught error: ${e}`);
    if (!(e instanceof Error)) {
      throw new TypeError("Recieved non-error value");
    }
  },
});
