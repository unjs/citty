import consola from "consola";
import { defineCittyPlugin } from "../../src";

export default defineCittyPlugin(() => {
  consola.success("Log plugin loaded");

  return {
    name: "log",
    setup() {
      consola.info("Setting up log plugin");
    },
    cleanup() {
      consola.info("Cleaning up log plugin");
    },
  };
});
