Citty: Elegant, zero-dependency CLI builder for Node.js.

**Important:** Keep `AGENTS.md` updated with project information.

## Project Structure

```
src/
├── index.ts          # Public API re-exports
├── types.ts          # All type definitions (ArgDef, CommandDef, ParsedArgs, etc.)
├── command.ts        # defineCommand(), runCommand(), resolveSubCommand()
├── main.ts           # runMain(), createMain() — CLI entry point with --help/--version
├── args.ts           # parseArgs() — argument parsing and validation
├── usage.ts          # renderUsage(), showUsage() — help text generation
├── _parser.ts        # Low-level parser wrapping node:util.parseArgs (internal)
├── _utils.ts         # toArray, formatLineColumns, resolveValue, CLIError (internal)
└── _color.ts         # ANSI color helpers with NO_COLOR support (internal)

test/                 # Vitest tests (args, parser, main, usage, utils)
playground/           # Example CLI apps (run with `pnpm play`)
```

Internal files use `_` prefix and are not exported from `index.ts`.

## Public API

```typescript
// Core
defineCommand(def)           // Define a typed command
runCommand(cmd, opts)        // Execute a command programmatically
runMain(cmd, opts?)          // CLI entry point (handles --help, --version, process.exit)
createMain(cmd)              // Returns a function wrapping runMain()

// Utilities
parseArgs(rawArgs, argsDef)  // Parse CLI arguments against definitions
renderUsage(cmd, parent?)    // Generate help text string
showUsage(cmd, parent?)      // Print help to console
```

## Architecture

### Argument Types

- `positional` — unnamed args (`cli <name>`)
- `string` — named string options (`--name value`)
- `boolean` — flags (`--verbose`, `--no-verbose` for negation)
- `enum` — constrained to `options` array (`--level=info|warn|error`)

Arguments are **case-agnostic** — `--user-name` and `--userName` resolve to the same value via auto-generated aliases (uses `scule` for case conversion) and a Proxy-based accessor.

### Command Lifecycle

`setup()` → resolve subcommand or `run()` → `cleanup()` (always runs in `finally`)

### Lazy Loading

`Resolvable<T> = T | Promise<T> | (() => T) | (() => Promise<T>)` — used for `meta`, `args`, and `subCommands` to support dynamic imports.

### Error Handling

Custom `CLIError` class with error codes: `EARG`, `E_UNKNOWN_COMMAND`, `E_NO_COMMAND`, `E_NO_VERSION`. Usage is auto-shown before error messages in `runMain`.

## Dependencies

**Zero runtime dependencies.** Only `scule` is used from source code (bundled at build time).

## Scripts

| Command           | Description                             |
| ----------------- | --------------------------------------- |
| `pnpm dev`        | Vitest watch mode                       |
| `pnpm test`       | Lint + typecheck + vitest with coverage |
| `pnpm test:types` | Type checking via `tsgo --noEmit`       |
| `pnpm lint`       | `oxlint . && oxfmt --check`             |
| `pnpm fmt`   | `oxlint . --fix && oxfmt`               |
| `pnpm build`      | Build with obuild → `dist/`             |
| `pnpm play`       | Run playground CLI                      |

## Tooling

- **Build:** obuild (single entry `src/index.ts` → `dist/index.mjs`)
- **Test:** Vitest with `@vitest/coverage-v8`, typecheck enabled
- **Lint:** oxlint (plugins: unicorn, typescript, oxc)
- **Format:** oxfmt
- **TypeScript:** strict mode, `nodenext` module, `verbatimModuleSyntax`

## Conventions

- ESM with explicit `.ts` extensions in imports
- Internal files prefixed with `_` (not exported)
- Tests use inline snapshots for usage output verification
- Colors respect `NO_COLOR`, `TERM=dumb`, `TEST`, `CI` env vars
- `--no-flag` negation requires `default: true` or `negativeDescription` on the arg def
