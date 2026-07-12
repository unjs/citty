# 🌆 citty

<!-- automd:badges color=yellow bundlephobia -->

[![npm version](https://img.shields.io/npm/v/citty?color=yellow)](https://npmjs.com/package/citty)
[![npm downloads](https://img.shields.io/npm/dm/citty?color=yellow)](https://npmjs.com/package/citty)
[![bundle size](https://img.shields.io/bundlephobia/minzip/citty?color=yellow)](https://bundlephobia.com/package/citty)

<!-- /automd -->

Elegant CLI Builder

- Zero dependency, fast and lightweight (based on native [`util.parseArgs`](https://nodejs.org/api/util.html#utilparseargsconfig))
- Smart value parsing with typecast and boolean shortcuts
- Nested sub-commands with lazy and async loading
- Pluggable and composable API with auto generated usage

## Usage

```sh
npx nypm add -D citty
```

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
  setup({ args }) {
    console.log(`now setup ${args.command}`);
  },
  cleanup({ args }) {
    console.log(`now cleanup ${args.command}`);
  },
  run({ args }) {
    console.log(`${args.friendly ? "Hi" : "Greetings"} ${args.name}!`);
  },
});

runMain(main);
```

```sh
node index.mjs john
# Greetings john!
```

### Sub Commands

Sub commands can be nested recursively. Use lazy imports for large CLIs to avoid loading all commands at once.

```js
import { defineCommand, runMain } from "citty";

const sub = defineCommand({
  meta: { name: "sub", description: "Sub command" },
  args: {
    name: { type: "positional", description: "Your name", required: true },
  },
  run({ args }) {
    console.log(`Hello ${args.name}!`);
  },
});

const main = defineCommand({
  meta: { name: "hello", version: "1.0.0", description: "My Awesome CLI App" },
  subCommands: { sub },
});

runMain(main);
```

Subcommands support `meta.alias` (e.g., `["i", "add"]`) and `meta.hidden: true` to hide from help output.

### Lazy Commands

For large CLIs, lazy load sub commands so only the executed command is imported:

```js
const main = defineCommand({
  meta: { name: "hello", version: "1.0.0", description: "My Awesome CLI App" },
  subCommands: {
    sub: () => import("./sub.mjs").then((m) => m.default),
  },
});
```

`meta`, `args`, and `subCommands` all accept `Resolvable<T>` values — a value, Promise, function, or async function — enabling lazy and dynamic resolution.

### Hooks

Commands support `setup` and `cleanup` functions called before and after `run()`. Only the executed command's hooks run. `cleanup` always runs, even if `run()` throws.

```js
const main = defineCommand({
  meta: { name: "hello", version: "1.0.0", description: "My Awesome CLI App" },
  setup() {
    console.log("Setting up...");
  },
  cleanup() {
    console.log("Cleaning up...");
  },
  run() {
    console.log("Hello World!");
  },
});
```

### Plugins

Plugins extend commands with reusable `setup` and `cleanup` hooks:

```js
import { defineCommand, defineCittyPlugin, runMain } from "citty";

const logger = defineCittyPlugin({
  name: "logger",
  setup({ args }) {
    console.log("Logger setup, args:", args);
  },
  cleanup() {
    console.log("Logger cleanup");
  },
});

const main = defineCommand({
  meta: { name: "hello", description: "My CLI App" },
  plugins: [logger],
  run() {
    console.log("Hello!");
  },
});

runMain(main);
```

Plugin `setup` hooks run before the command's `setup` (in order), `cleanup` hooks run after (in reverse). Plugins can be async or factory functions.

## Arguments

### Argument Types

| Type         | Description                              | Example                     |
| ------------ | ---------------------------------------- | --------------------------- |
| `positional` | Unnamed positional args                  | `cli <name>`                |
| `string`     | Named string options                     | `--name value`              |
| `boolean`    | Boolean flags, supports `--no-` negation | `--verbose`                 |
| `enum`       | Constrained to `options` array           | `--level=info\|warn\|error` |

### Common Options

| Option        | Description                                                          |
| ------------- | -------------------------------------------------------------------- |
| `description` | Help text shown in usage output                                      |
| `required`    | Whether the argument is required                                     |
| `multiple`    | Collect repeated values into an array (`string`/`enum`/`positional`) |
| `default`     | Default value when not provided                                      |
| `alias`       | Short aliases (e.g., `["f"]`). Not for `positional`                  |
| `valueHint`   | Display hint in help (e.g., `"host"` renders `--name=<host>`)        |

### Example

```js
const main = defineCommand({
  args: {
    name: { type: "positional", description: "Your name", required: true },
    friendly: { type: "boolean", description: "Use friendly greeting", alias: ["f"] },
    greeting: { type: "string", description: "Custom greeting", default: "Hello" },
    level: {
      type: "enum",
      description: "Log level",
      options: ["debug", "info", "warn", "error"],
      default: "info",
    },
  },
  run({ args }) {
    console.log(`${args.greeting} ${args.name}! (level: ${args.level})`);
  },
});
```

### Multiple Values

Set `multiple: true` to collect repeated values into an array. It works with `string`, `enum`, and `positional` arguments. Combined with `required`, it expresses the full cardinality matrix (both default to `false`):

| `required` | `multiple` | Cardinality  | Parsed type             |
| ---------- | ---------- | ------------ | ----------------------- |
| `false`    | `false`    | zero or one  | `T \| undefined`        |
| `true`     | `false`    | exactly one  | `T`                     |
| `false`    | `true`     | zero or more | `T[]` (`[]` when empty) |
| `true`     | `true`     | one or more  | `T[]` (must have ≥ 1)   |

A repeated flag collects each occurrence, and a `multiple` positional is variadic — it greedily consumes the remaining positional tokens. Only the last positional may be `multiple`.

```js
const main = defineCommand({
  args: {
    // Repeatable flag: `--env A=1 --env B=2` → ["A=1", "B=2"]
    env: {
      type: "string",
      description: "Environment variable as NAME=VALUE (repeatable)",
      multiple: true,
    },
    // Variadic positional: `lint a.ts b.ts` → ["a.ts", "b.ts"]
    files: {
      type: "positional",
      description: "Files to lint",
      required: true,
      multiple: true,
    },
  },
  run({ args }) {
    console.log(args.env); // string[]
    console.log(args.files); // string[]
  },
});
```

### Boolean Negation

Boolean args support `--no-` prefix. The negative variant appears in help when `default: true` or `negativeDescription` is set.

### Case-Agnostic Access

Kebab-case args can be accessed as camelCase: `args["output-dir"]` and `args.outputDir` both work.

## Built-in Flags

`--help` / `-h` and `--version` / `-v` are handled automatically. Disabled if your command defines args with the same names or aliases.

## API

| Function                      | Description                                                                |
| ----------------------------- | -------------------------------------------------------------------------- |
| `defineCommand(def)`          | Type helper for defining commands                                          |
| `runMain(cmd, opts?)`         | Run a command with usage support and graceful error handling               |
| `createMain(cmd)`             | Create a wrapper that calls `runMain` when invoked                         |
| `runCommand(cmd, opts)`       | Parse args and run command/sub-commands; access `result` from return value |
| `parseArgs(rawArgs, argsDef)` | Parse input arguments and apply defaults                                   |
| `renderUsage(cmd, parent?)`   | Render command usage to a string                                           |
| `showUsage(cmd, parent?)`     | Render usage and print to console                                          |
| `defineCittyPlugin(def)`      | Type helper for defining plugins                                           |

## Development

- Clone this repository
- Install latest LTS version of [Node.js](https://nodejs.org/en/)
- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable`
- Install dependencies using `pnpm install`
- Run interactive tests using `pnpm dev`

## License

Made with 💛 Published under [MIT License](./LICENSE).
