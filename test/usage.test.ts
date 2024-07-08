import { expect, it, describe } from "vitest";
import { renderUsage } from "../src/usage";
import { defineCommand } from "../src";

describe("usage", () => {
  it("renders arguments", async () => {
    const command = defineCommand({
      meta: {
        name: "Commander",
        description: "A command",
      },
      args: {
        foo: {
          required: true,
          description: "A foo",
        },
        bar: {
          alias: ["b"],
          description: "A bar",
        },
        pos: {
          type: "positional",
          name: "pos",
          description: "A pos",
        },
        enum: {
          type: "enum",
          name: "enum",
          options: ["a", "b"],
          description: "An enum",
        },
        boolean: {
          type: "boolean",
          name: "boolean",
          description: "A boolean",
        },
      },
    });

    const usage = await renderUsage(command);

    expect(usage).toMatchInlineSnapshot(`
      "[90mA command (Commander)[39m

      [4m[1mUSAGE[22m[24m \`Commander [OPTIONS] --foo <POS>\`

      [4m[1mARGUMENTS[22m[24m

        \`POS\`    A pos    

      [4m[1mOPTIONS[22m[24m

        \`--foo (required)\`    A foo    
               \`-b, --bar\`    A bar    
            \`--enum=<a|b>\`    An enum  
               \`--boolean\`    A boolean
      "
    `);
  });

  it("renders subcommands", async () => {
    const command = defineCommand({
      meta: {
        name: "Commander",
        description: "A command",
      },
      subCommands: {
        sub: defineCommand({
          meta: {
            name: "Subcommander",
            description: "A subcommand",
          },
        }),
      },
    });

    const usage = await renderUsage(command);

    expect(usage).toMatchInlineSnapshot(`
      "[90mA command (Commander)[39m

      [4m[1mUSAGE[22m[24m \`Commander sub\`

      [4m[1mCOMMANDS[22m[24m

        \`sub\`    A subcommand

      Use \`Commander <command> --help\` for more information about a command."
    `);
  });

  it("renders both arguments and subcommands", async () => {
    const command = defineCommand({
      meta: {
        name: "Commander",
        description: "A command",
      },
      args: {
        foo: {
          required: true,
          description: "A foo",
        },
      },
      subCommands: {
        sub: defineCommand({
          meta: {
            name: "Subcommander",
            description: "A subcommand",
          },
        }),
      },
    });

    const usage = await renderUsage(command);

    expect(usage).toMatchInlineSnapshot(`
      "[90mA command (Commander)[39m

      [4m[1mUSAGE[22m[24m \`Commander [OPTIONS] --foo sub\`

      [4m[1mOPTIONS[22m[24m

        \`--foo (required)\`    A foo

      [4m[1mCOMMANDS[22m[24m

        \`sub\`    A subcommand

      Use \`Commander <command> --help\` for more information about a command."
    `);
  });

  it("does not render hidden subcommands", async () => {
    const command = defineCommand({
      meta: {
        name: "Commander",
        description: "A command",
      },
      subCommands: {
        sub: defineCommand({
          meta: {
            name: "Subcommander",
            description: "A subcommand",
            hidden: true,
          },
        }),
        start: defineCommand({
          meta: {
            name: "Start",
            description: "A start",
          },
        }),
      },
    });

    const usage = await renderUsage(command);

    expect(usage).toMatchInlineSnapshot(`
      "[90mA command (Commander)[39m

      [4m[1mUSAGE[22m[24m \`Commander start\`

      [4m[1mCOMMANDS[22m[24m

        \`start\`    A start

      Use \`Commander <command> --help\` for more information about a command."
    `);
  });
});
