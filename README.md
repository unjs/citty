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
- Plugable and composable API
- Auto generated usage and help

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

### `runRawMain`

Runs a command. Unlike `runMain`, this function requires you to define command execution handling like `handleCommand` and error handling yourself like `handleError` and specify them as arguments.

> [!NOTE]
> This function is a low-level function compared to `runMain`. You should also implement your own `showUsage` etc. and specify it as an option.

### `handleCommand`

A handler that implements the logic to execute commands with usage support. It is used inside in `runMain`. You can specify it as a helper to `run`.

### `handleError`

An error handler that implementes the logic to graceful error handling. It is used inside `runMain`. You can specify it as a helper to `run`.

### `runCommand`

Parses input args and runs command and sub-commands (unsupervised). You can access `result` key from returnd/awaited value to access command's result.

### `parseArgs`

Parses input arguments and applies defaults.

### `renderUsage`

Renders command usage to a string value.

### `showUsage`

Renders usage and prints to the console

### `formatLineColumns`

Formats line columns. If you define custom `showUsage`, it is convenient to adjust the format with this function.

## Development

- Clone this repository
- Install latest LTS version of [Node.js](https://nodejs.org/en/)
- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable`
- Install dependencies using `pnpm install`
- Run interactive tests using `pnpm dev`

## License

Made with 💛 Published under [MIT License](./LICENSE).

Argument parser is based on [lukeed/mri](https://github.com/lukeed/mri) by Luke Edwards ([@lukeed](https://github.com/lukeed)).
