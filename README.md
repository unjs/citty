# 🌆 citty

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![Codecov][codecov-src]][codecov-href]
[![License][license-src]][license-href]

> Elegant CLI Builder

- Fast and lightweight argument parser based on [mri](https://github.com/lukeed/mri)
- Smart value parsing with typecast, boolean shortcuts and unknown flag handling
- Nested sub-commands
- Lazy and Async commands
- Plugable and composable API
- Auto generated usage and help

🚧 This project is under heavy development. More features are coming soon!

## Install

Install package:

```sh
npm install citty
```

```sh
yarn add citty
```

```sh
pnpm install citty
```

## Usage

### Import Package

```js
// ESM
import { defineCommand, runMain } from "citty";
```

```js
// CommonJS
const { defineCommand, runMain } = require("citty");
```

### Main Command

```js
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
  run({ args }) { // Command can be async
    console.log(`${args.friendly ? "Hi" : "Greetings"} ${args.name}!`);
  },
});

runMain(main);
```

### Sub Commands

You can define sub commands and attach them to main command to create a nested command structure. This is recursive so you can attach sub commands to sub commands, etc.

```js
import { defineCommand, runMain } from "citty";

// First, you define a new command
const sub = defineCommand({
  meta: {
    name: "sub",
    description: "Sub command",
  },
  args: { // Sub commands can have their own arguments like any other command
    name: {
      type: "positional",
      description: "Your name",
      required: true,
    },
  },
  run({ args }) { // Command can be async
    console.log(`Hello ${args.name}!`);
  },
});

// Then, you define a main command and attach sub command to it
const main = defineCommand({
  meta: {
    name: "hello",
    version: "1.0.0",
    description: "My Awesome CLI App",
  },
  commands: {
    sub, // Attach sub command to main command
  },
});

runMain(main);
```

### Hooks

`citty` supports a `setup` and `cleanup`  functions that are called before and after command execution. This is useful for setting up and cleaning up resources.

Only the `setup` and `cleanup` functions from the command called are executed. For example, if you run `hello sub`, only the `setup` and `cleanup` functions from `sub` command are executed and not the ones from `hello` command.

```js
import { defineCommand, runMain } from "citty";

const main = defineCommand({
  meta: {
    name: "hello",
    version: "1.0.0",
    description: "My Awesome CLI App",
  },
  setup() { // Setup function is called before command execution or before any sub command execution
    console.log("Setting up...");
  },
  cleanup() { // Cleanup function is called after command execution or after any sub command execution
    console.log("Cleaning up...");
  },
  run() {
    console.log("Hello World!");
  },
});

runMain(main);
```

### Lazy Load Commands

For large CLI apps, you may want to only load the command that is being executed.

First, create a command in a file and export it.

```js
import { defineCommand } from "citty";

export default defineCommand({
  meta: {
    name: "sub",
    description: "Sub command",
  },
  run({ args }) {
    console.log(`Hello ${args.name}!`);
  },
});
```

Then, create the main command and import the sub command.

```js
const main = defineCommand({
  meta: {
    name: "hello",
    version: "1.0.0",
    description: "My Awesome CLI App",
  },
  commands: {
    sub: () => import("./sub.js").then((m) => m.default), // Lazy Import Sub Command
  },
});
```

Now, when you run `hello sub`, the sub command will be loaded and executed. This avoid to load all commands at once.

### Publish CLI App as an Executable

You must first bundle your CLI app. To do so, you can use [`unjs/unbuild`](https://github.com/unjs/unbuild).

Then, you must create a file named `index.mjs` in a folder named `bin` at the root of your package. This file must export the main command from the `dist` build.

```js
#!/usr/bin/env node

import { runMain } from '../dist/index.mjs'

runMain()
```

Then, you will need to update your `package.json` file to enable the usage as a CLI:

```json
{
  "type": "module",
  "bin": "./bin/index.mjs",
  // Name of the CLI will be the name of the package. You can provide an object to change the name.
  // @see https://docs.npmjs.com/cli/v10/configuring-npm/package-json#bin
  // "bin": {
  //   "my-cli": "./bin/index.mjs"
  // },
  "files": [
    "bin",
    "dist"
  ]
}
```

You're ready to publish your CLI app to npm!

## Utils

### `defineCommand`

A type helper for defining commands.

### `runMain`

Runs a command with usage support and graceful error handling.

### `createMain`

Create the main command that can be executed later. Return a [`runMain`](#runmain) function.

### `runCommand`

Parses input args and runs command and sub-commands (unsupervised).

### `parseArgs`

Parses input arguments and applies defaults.

### `renderUsage`

Renders command usage to a string value.

### `showUsage`

Renders usage and prints to the console

## Development

- Clone this repository
- Install latest LTS version of [Node.js](https://nodejs.org/en/)
- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable`
- Install dependencies using `pnpm install`
- Run interactive tests using `pnpm dev`

## License

Made with 💛 Published under [MIT License](./LICENSE).

Argument parser is based on [lukeed/mri](https://github.com/lukeed/mri) by Luke Edwards ([@lukeed](https://github.com/lukeed)).

<!-- Badges -->

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/citty?style=flat&colorA=18181B&colorB=F0DB4F
[npm-version-href]: https://npmjs.com/package/citty
[npm-downloads-src]: https://img.shields.io/npm/dm/citty?style=flat&colorA=18181B&colorB=F0DB4F
[npm-downloads-href]: https://npmjs.com/package/citty
[codecov-src]: https://img.shields.io/codecov/c/gh/unjs/citty/main?style=flat&colorA=18181B&colorB=F0DB4F
[codecov-href]: https://codecov.io/gh/unjs/citty
[bundle-src]: https://img.shields.io/bundlephobia/minzip/citty?style=flat&colorA=18181B&colorB=F0DB4F
[bundle-href]: https://bundlephobia.com/result?p=citty
[license-src]: https://img.shields.io/github/license/unjs/citty.svg?style=flat&colorA=18181B&colorB=F0DB4F
[license-href]: https://github.com/unjs/citty/blob/main/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsDocs.io-reference-18181B?style=flat&colorA=18181B&colorB=F0DB4F
[jsdocs-href]: https://www.jsdocs.io/package/citty
