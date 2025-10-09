# 🌆 citty

<!-- automd:badges color=yellow bundlephobia -->

[![npm version](https://img.shields.io/npm/v/citty?color=yellow)](https://npmjs.com/package/citty)
[![npm downloads](https://img.shields.io/npm/dm/citty?color=yellow)](https://npmjs.com/package/citty)
[![bundle size](https://img.shields.io/bundlephobia/minzip/citty?color=yellow)](https://bundlephobia.com/package/citty)

<!-- /automd -->

Elegant CLI Builder

- Fast and lightweight argument parser based on [mri](https://github.com/lukeed/mri)
- Smart value parsing with typecast, boolean shortcuts and unknown flag handling
- Nested sub-commands
- Lazy and Async commands
- Pluggable and composable API
- Auto generated usage and help
- Shell autocompletion support via [tab](https://github.com/bombshell-dev/tab) integration

🚧 This project is under heavy development. More features are coming soon!

## Usage

Install package:

```sh
# npm
npm install citty

# yarn
yarn add citty

# pnpm
pnpm install citty
```

Import:

```js
// ESM
import { defineCommand, runMain } from "citty";

// CommonJS
const { defineCommand, runMain } = require("citty");
```

Define main command to run:

```ts
import { defineCommand, runMain } from "citty";

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
    console.log(`${args.friendly ? "Hi" : "Greetings"} ${args.name}!`);
  },
});

runMain(main);
```

## Utils

### `defineCommand`

`defineCommand` is a type helper for defining commands.

### `runMain`

Runs a command with usage support and graceful error handling.

### `createMain`

Create a wrapper around command that calls `runMain` when called.

### `runCommand`

Parses input args and runs command and sub-commands (unsupervised). You can access `result` key from returnd/awaited value to access command's result.

### `parseArgs`

Parses input arguments and applies defaults.

### `renderUsage`

Renders command usage to a string value.

### `showUsage`

Renders usage and prints to the console

## Autocompletions

Citty works with [tab](https://github.com/bombshell-dev/tab) to provide shell autocompletions across `zsh`, `bash`, `fish`, and `powershell`.

```sh
npm install @bomb.sh/tab
```

Add autocompletions to your citty CLI:

```ts
import { defineCommand, createMain } from "citty";
import tab from "@bomb.sh/tab/citty";

const main = defineCommand({
  meta: {
    name: "my-cli",
    description: "My CLI tool",
  },
  subCommands: {
    dev: defineCommand({
      meta: {
        name: "dev",
        description: "Start dev server",
      },
      args: {
        port: {
          type: "string",
          description: "Specify port",
        },
        host: {
          type: "string",
          description: "Specify host",
        },
      },
    }),
  },
});

const completion = await tab(main);

// Add custom completions for option values
const devCommand = completion.commands.get("dev");
const portOption = devCommand.options.get("port");
if (portOption) {
  portOption.handler = (complete) => {
    complete("3000", "Development port");
    complete("8080", "Production port");
  };
}

const cli = createMain(main);
cli();
```

### Testing Completions

Test your completions locally:

```sh
node my-cli.js complete -- dev --port=<TAB>
# Output: --port=3000  Development port
#         --port=8080  Production port
```

### Installing Completions

For end users, completions can be installed:

```sh
# One-time setup (zsh example)
source <(my-cli complete zsh)

# Permanent setup
my-cli complete zsh > ~/.my-cli-completion.zsh
echo 'source ~/.my-cli-completion.zsh' >> ~/.zshrc
```

### Package Manager Completions

When users install tab, they also get autocompletions for package managers! Tab provides completions for `pnpm`, `npm`, `yarn`, and `bun` out of the box.
This means your users will enjoy autocompletions not only for your citty CLI but also for their everyday package manager commands!

Learn more about tab at [github.com/bombshell-dev/tab](https://github.com/bombshell-dev/tab).

## Development

- Clone this repository
- Install latest LTS version of [Node.js](https://nodejs.org/en/)
- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable`
- Install dependencies using `pnpm install`
- Run interactive tests using `pnpm dev`

## License

Made with 💛 Published under [MIT License](./LICENSE).

Argument parser is based on [lukeed/mri](https://github.com/lukeed/mri) by Luke Edwards ([@lukeed](https://github.com/lukeed)).
