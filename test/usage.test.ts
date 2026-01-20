import { expect, it, describe } from "vitest";
import { renderUsage } from "../src/usage.ts";
import { defineCommand } from "../src/index.ts";

describe("usage", () => {
  it("renders arguments", async () => {
    const command = defineCommand({
      meta: {
        name: "Commander",
        description: "A command",
      },
      args: {
        foo: {
          type: "string",
          required: true,
          description: "A foo",
        },
        bar: {
          alias: ["b"],
          type: "string",
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

      [4m[1mUSAGE[22m[24m [36mCommander [OPTIONS] --foo <POS>[39m

      [4m[1mARGUMENTS[22m[24m

        [36mPOS[39m    A pos    

      [4m[1mOPTIONS[22m[24m

        [36m--foo (required)[39m    A foo    
               [36m-b, --bar[39m    A bar    
            [36m--enum=<a|b>[39m    An enum  
               [36m--boolean[39m    A boolean
      "
    `);
  });

  it("renders the negative description when a boolean default is true", async () => {
    const command = defineCommand({
      meta: {
        name: "Commander",
        description: "A command",
      },
      args: {
        boolean: {
          type: "boolean",
          name: "boolean",
          default: true,
          description: "A boolean",
          negativeDescription: "A negative boolean",
        },
      },
    });

    const usage = await renderUsage(command);

    expect(usage).toMatchInlineSnapshot(`
      "[90mA command (Commander)[39m

      [4m[1mUSAGE[22m[24m [36mCommander [OPTIONS] [39m

      [4m[1mOPTIONS[22m[24m

           [36m--boolean[39m    A boolean         
        [36m--no-boolean[39m    A negative boolean
      "
    `);
  });

  it('renders arguments hints when "valueHint" is provided', async () => {
    const command = defineCommand({
      meta: {
        name: "Commander",
        description: "A command",
      },
      args: {
        foo: {
          type: "string",
          description: "A foo",
          valueHint: "FOO",
        },
      },
    });

    const usage = await renderUsage(command);

    expect(usage).toMatchInlineSnapshot(`
      "[90mA command (Commander)[39m

      [4m[1mUSAGE[22m[24m [36mCommander [OPTIONS] [39m

      [4m[1mOPTIONS[22m[24m

        [36m--foo=<FOO>[39m    A foo
      "
    `);
  });

  it("renders the default value when provided", async () => {
    const command = defineCommand({
      meta: {
        name: "Commander",
        description: "A command",
      },
      args: {
        foo: {
          type: "string",
          description: "A foo",
          default: "bar",
        },
      },
    });

    const usage = await renderUsage(command);

    expect(usage).toMatchInlineSnapshot(`
      "[90mA command (Commander)[39m

      [4m[1mUSAGE[22m[24m [36mCommander [OPTIONS] [39m

      [4m[1mOPTIONS[22m[24m

        [36m--foo="bar"[39m    A foo
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

      [4m[1mUSAGE[22m[24m [36mCommander sub[39m

      [4m[1mCOMMANDS[22m[24m

        [36msub[39m    A subcommand

      Use [36mCommander <command> --help[39m for more information about a command."
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

      [4m[1mUSAGE[22m[24m [36mCommander [OPTIONS] --foo sub[39m

      [4m[1mOPTIONS[22m[24m

        [36m--foo (required)[39m    A foo

      [4m[1mCOMMANDS[22m[24m

        [36msub[39m    A subcommand

      Use [36mCommander <command> --help[39m for more information about a command."
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

      [4m[1mUSAGE[22m[24m [36mCommander start[39m

      [4m[1mCOMMANDS[22m[24m

        [36mstart[39m    A start

      Use [36mCommander <command> --help[39m for more information about a command."
    `);
  });

  it("uses parents meta to explain how to run sub commands", async () => {
    const childCommand = defineCommand({
      meta: {
        name: "child-command",
        description: "A child command",
      },
      args: {
        foo: {
          type: "string",
          description: "A foo",
        },
      },
      subCommands: {
        "sub-command": defineCommand({}),
      },
    });

    const parentCommand = defineCommand({
      meta: {
        name: "parent-command",
      },
      subCommands: {
        sub: childCommand,
      },
    });

    const usage = await renderUsage(childCommand, parentCommand as any);

    expect(usage).toMatchInlineSnapshot(`
      "[90mA child command (parent-command child-command)[39m

      [4m[1mUSAGE[22m[24m [36mparent-command child-command [OPTIONS] sub-command[39m

      [4m[1mOPTIONS[22m[24m

        [36m--foo[39m    A foo

      [4m[1mCOMMANDS[22m[24m

        [36msub-command[39m    

      Use [36mparent-command child-command <command> --help[39m for more information about a command."
    `);
  });
});
