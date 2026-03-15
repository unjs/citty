# 🌆 citty

<!-- automd:badges color=yellow bundlephobia -->

[![npm version](https://img.shields.io/npm/v/citty?color=yellow)](https://npmjs.com/package/citty)
[![npm downloads](https://img.shields.io/npm/dm/citty?color=yellow)](https://npmjs.com/package/citty)
[![bundle size](https://img.shields.io/bundlephobia/minzip/citty?color=yellow)](https://bundlephobia.com/package/citty)

<!-- /automd -->

Elegant CLI Builder

- Zero dependency
- Fast and lightweight argument parser (based on native [Node.js `util.parseArgs`](https://nodejs.org/api/util.html#utilparseargsconfig))
- Smart value parsing with typecast and boolean shortcuts
- Nested sub-commands
- Lazy and Async commands
- Pluggable and composable API
- Auto generated usage and help

## Usage

Install package:

```sh
npx nypm add -D citty
```

### Import Package

```js
import { defineCommand, runMain } from "citty";
```

### Main Command

Create a main command is the first step to create a CLI app. You can do it in a `index.mjs` file.

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
  run({ args }) {
    console.log(`${args.friendly ? "Hi" : "Greetings"} ${args.name}!`);
  },
});

runMain(main);
```

Then, you can execute your CLI app:

```sh
node index.mjs john
# output: Greetings john!
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
  args: {
    name: {
      type: "positional",
      description: "Your name",
      required: true,
    },
  },
  run({ args }) {
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
  subCommands: {
    sub, // Attach sub command to main command
  },
});

runMain(main);
```

Then, you can execute your CLI app:

```sh
node index.mjs sub john
# output: Hello john!
```

#### Subcommand Aliases

Subcommands can have aliases, allowing them to be invoked with alternative names:

```js
const install = defineCommand({
  meta: {
    name: "install",
    description: "Install dependencies",
    alias: ["i", "add"], // Can be invoked as `cli install`, `cli i`, or `cli add`
  },
  run() {
    console.log("Installing...");
  },
});
```

#### Hidden Commands

You can hide a command from the help output by setting `meta.hidden` to `true`. The command still works normally but won't be listed in usage:

```js
const debug = defineCommand({
  meta: {
    name: "debug",
    description: "Debug command",
    hidden: true, // Won't appear in help output
  },
  run() {
    console.log("Debugging...");
  },
});
```

### Hooks

`citty` supports `setup` and `cleanup` functions that are called before and after command execution. This is useful for setting up and cleaning up resources.

Only the `setup` and `cleanup` functions from the command called are executed. For example, if you run `hello sub`, only the `setup` and `cleanup` functions from `sub` command are executed and not the ones from `hello` command.

```js
import { defineCommand, runMain } from "citty";

const main = defineCommand({
  meta: {
    name: "hello",
    version: "1.0.0",
    description: "My Awesome CLI App",
  },
  setup() {
    console.log("Setting up...");
  },
  cleanup() {
    // cleanup is always called, even if run() throws
    console.log("Cleaning up...");
  },
  run() {
    console.log("Hello World!");
  },
});

runMain(main);
```

Now, you can run your CLI app:

```sh
node index.mjs
```

And you will see:

```sh
Setting up...
Hello World!
Cleaning up...
```

### Plugins

Plugins allow you to extend commands with reusable `setup` and `cleanup` hooks:

```js
import { defineCommand, defineCittyPlugin, runMain } from "citty";

const logger = defineCittyPlugin({
  name: "logger",
  setup({ args }) {
    console.log("Logger plugin setup, args:", args);
  },
  cleanup() {
    console.log("Logger plugin cleanup");
  },
});

const main = defineCommand({
  meta: {
    name: "hello",
    description: "My CLI App",
  },
  plugins: [logger],
  run() {
    console.log("Hello!");
  },
});

runMain(main);
```

Plugin `setup` hooks run before the command's `setup` (in declaration order), and `cleanup` hooks run after the command's `cleanup` (in reverse order). `cleanup` always runs, even if `run` throws. Plugins can also be async or factory functions.

### Lazy Load Commands

For large CLI apps, you may want to only load the command that is being executed.

First, create a command in a file named `sub.mjs` and export it.

```js
import { defineCommand } from "citty";

export default defineCommand({
  meta: {
    name: "sub",
    description: "Sub command",
  },
  args: {
    name: {
      type: "positional",
      description: "Your name",
      required: true,
    },
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
  subCommands: {
    sub: () => import("./sub.mjs").then((m) => m.default), // Lazy Import Sub Command
  },
});
```

Now, when you run `node index.mjs sub`, the sub command will be loaded and executed. This avoid to load all commands at once when you start your app.

### Publish CLI App as an Executable

You must first bundle your CLI app. To do so, you can use [`unjs/unbuild`](https://github.com/unjs/unbuild).

Then, you must create a file named `index.mjs` in a folder named `bin` at the root of your package. This file must export the main command from the `dist` build.

```js
#!/usr/bin/env node

import { runMain } from "../dist/index.mjs";

runMain();
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
  "files": ["bin", "dist"]
}
```

You're ready to publish your CLI app to npm!

## Arguments

When you create a command with `defineCommand`, you can provide an `args` object to define the arguments of the command.

### Argument Types

There are 4 types of arguments:

- **`positional`**: Unnamed positional arguments (e.g., `cli <name>`). Positional args don't support `alias`.
- **`string`**: Named string options (e.g., `--name value` or `--name=value`).
- **`boolean`**: Boolean flags (e.g., `--verbose`). Supports negation with `--no-verbose` when the default is `true` or `negativeDescription` is set.
- **`enum`**: Constrained to a fixed set of values defined by `options` (e.g., `--level=info|warn|error`).

### Common Options

All argument types support these options:

- `description` — Help text shown in usage output.
- `required` — Whether the argument is required.
- `default` — Default value when not provided.
- `alias` — Short aliases (e.g., `["f", "F"]`). Not available for `positional` args.
- `valueHint` — Display hint in help output (e.g., `"host"` renders as `--name=<host>`).

### Example

```js
const main = defineCommand({
  args: {
    name: {
      type: "positional",
      description: "Your name",
      required: true,
    },
    friendly: {
      type: "boolean",
      description: "Use friendly greeting",
      alias: ["f"],
    },
    greeting: {
      type: "string",
      description: "Custom greeting",
      default: "Hello",
    },
    level: {
      type: "enum",
      description: "Log level",
      options: ["debug", "info", "warn", "error"],
      default: "info",
    },
  },
  run({ args }) {
    // args is fully typed based on the definitions above
    console.log(`${args.greeting} ${args.name}! (level: ${args.level})`);
  },
});
```

### Boolean Negation

Boolean arguments support `--no-` prefix for negation. The negative variant appears in help output when the argument has `default: true` or a `negativeDescription`:

```js
const main = defineCommand({
  args: {
    color: {
      type: "boolean",
      description: "Enable colorized output",
      negativeDescription: "Disable colorized output",
      default: true,
    },
  },
  run({ args }) {
    // Use --color or --no-color
    console.log(args.color ? "colorful!" : "plain");
  },
});
```

### Case-Agnostic Access

Arguments defined with kebab-case names can be accessed using either kebab-case or camelCase:

```js
const main = defineCommand({
  args: {
    "output-dir": {
      type: "string",
      description: "Output directory",
    },
  },
  run({ args }) {
    // Both work:
    console.log(args["output-dir"]);
    console.log(args.outputDir);
  },
});
```

## Built-in Commands

citty automatically handles `--help` / `-h` and `--version` / `-v` flags. If your command defines `meta.version`, users can run `--version` to display it. These built-in flags are automatically disabled if your command defines args with the same names or aliases.

## API

### `defineCommand`

A type helper for defining commands.

### `runMain`

Runs a command with usage support and graceful error handling.

### `createMain`

Create a wrapper around command that calls `runMain` when called.

### `runCommand`

Parses input args and runs command and sub-commands (unsupervised). You can access `result` key from returned/awaited value to access command's result.

### `parseArgs`

Parses input arguments and applies defaults.

### `renderUsage`

Renders command usage to a string value.

### `showUsage`

Renders usage and prints to the console.

### `defineCittyPlugin`

A type helper for defining plugins.

## Development

- Clone this repository
- Install latest LTS version of [Node.js](https://nodejs.org/en/)
- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable`
- Install dependencies using `pnpm install`
- Run interactive tests using `pnpm dev`

## License

Made with 💛 Published under [MIT License](./LICENSE).
