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

      USAGE Commander [OPTIONS] --foo=<foo> <POS>

      ARGUMENTS

        POS    A pos (Required)

      OPTIONS

            --foo=<foo>    A foo (Required)
        -b, --bar=<bar>    A bar           
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

           --boolean    A boolean (Default: true)
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

        --foo=<foo>    A foo (Default: bar)
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

  it("annotates a default subcommand and makes command selection optional", async () => {
    const command = defineCommand({
      meta: { name: "my-cli", description: "My CLI" },
      default: "dev",
      subCommands: {
        dev: { meta: { description: "Start development server" } },
        build: { meta: { description: "Build for production" } },
      },
    });

    const usage = await renderUsage(command);
    expect(usage).toContain("USAGE my-cli [dev|build]");
    expect(usage).toContain("dev (default)");
    expect(usage.replaceAll(/ +$/gm, "")).toMatchInlineSnapshot(`
      "My CLI (my-cli)

      USAGE my-cli [dev|build]

      COMMANDS

        dev (default)    Start development server
                build    Build for production

      Use my-cli <command> --help for more information about a command."
    `);
  });

  it("resolves a lazy default through the first matching subcommand alias", async () => {
    const command = defineCommand({
      meta: { name: "my-cli" },
      default: async () => "serve",
      subCommands: async () => ({
        dev: async () => ({ meta: async () => ({ alias: ["serve", "s"] }) }),
        build: { meta: { alias: "serve" } },
      }),
    });

    const usage = await renderUsage(command);
    expect(usage).toContain("USAGE my-cli [dev|serve|s|build|serve]");
    expect(usage).toContain("dev, serve, s (default)");
    expect(usage).not.toContain("build, serve (default)");
  });

  it("prefers a registered default name over an earlier matching alias", async () => {
    const command = defineCommand({
      meta: { name: "my-cli" },
      default: Promise.resolve("build"),
      subCommands: {
        dev: { meta: { alias: "build" } },
        build: {},
      },
    });

    const usage = await renderUsage(command);
    expect(usage).toContain("build (default)");
    expect(usage).not.toContain("dev, build (default)");
  });

  it("keeps a hidden default hidden while allowing optional selection", async () => {
    const command = defineCommand({
      meta: { name: "my-cli" },
      default: "serve",
      subCommands: {
        dev: { meta: { alias: "serve", hidden: true } },
        build: {},
      },
    });

    const usage = await renderUsage(command);
    expect(usage).toContain("USAGE my-cli [build]");
    expect(usage).not.toContain("dev");
    expect(usage).not.toContain("serve");
    expect(usage).not.toContain("(default)");
  });

  it.each(["missing", ""])("does not advertise an invalid default %j", async (defaultName) => {
    const command = defineCommand({
      meta: { name: "my-cli" },
      default: defaultName,
      subCommands: { dev: {} },
    });

    const usage = await renderUsage(command);
    expect(usage).toContain("USAGE my-cli dev");
    expect(usage).not.toContain("(default)");
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

        --foo    A foo (Required)

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

        --foo=<foo>    A foo

      COMMANDS

        sub-command    

      Use parent-command child-command <command> --help for more information about a command."
    `);
  });
});
