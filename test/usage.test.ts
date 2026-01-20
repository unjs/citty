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
      "A command (Commander)

      USAGE Commander [OPTIONS] --foo <POS>

      ARGUMENTS

        POS    A pos    

      OPTIONS

        --foo (required)    A foo    
               -b, --bar    A bar    
            --enum=<a|b>    An enum  
               --boolean    A boolean
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
      "A command (Commander)

      USAGE Commander [OPTIONS] 

      OPTIONS

           --boolean    A boolean         
        --no-boolean    A negative boolean
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
      "A command (Commander)

      USAGE Commander [OPTIONS] 

      OPTIONS

        --foo=<FOO>    A foo
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
      "A command (Commander)

      USAGE Commander [OPTIONS] 

      OPTIONS

        --foo="bar"    A foo
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
      "A command (Commander)

      USAGE Commander sub

      COMMANDS

        sub    A subcommand

      Use Commander <command> --help for more information about a command."
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
      "A command (Commander)

      USAGE Commander [OPTIONS] --foo sub

      OPTIONS

        --foo (required)    A foo

      COMMANDS

        sub    A subcommand

      Use Commander <command> --help for more information about a command."
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
      "A command (Commander)

      USAGE Commander start

      COMMANDS

        start    A start

      Use Commander <command> --help for more information about a command."
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
      "A child command (parent-command child-command)

      USAGE parent-command child-command [OPTIONS] sub-command

      OPTIONS

        --foo    A foo

      COMMANDS

        sub-command    

      Use parent-command child-command <command> --help for more information about a command."
    `);
  });
});
