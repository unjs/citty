# Changelog


## v0.2.0

[compare changes](https://github.com/unjs/citty/compare/v0.1.6...v0.2.0)

### 🚀 Enhancements

- Support `hidden` meta to hide command ([#111](https://github.com/unjs/citty/pull/111))
- Support `enum` arg type ([#83](https://github.com/unjs/citty/pull/83))
- Support `number` arg type ([#73](https://github.com/unjs/citty/pull/73))
- Support `negativeDescription` for args ([#40](https://github.com/unjs/citty/pull/40))
- ⚠️  Parsed optionals and enum type safety ([#174](https://github.com/unjs/citty/pull/174))

### 🩹 Fixes

- ⚠️  Conditionally print negative boolean argument usage ([#177](https://github.com/unjs/citty/pull/177))
- **types:** Value type of NumberArgDef should be number ([#183](https://github.com/unjs/citty/pull/183))
- Show cli error message ([#186](https://github.com/unjs/citty/pull/186))
- Allow `number` arg to be optional ([#194](https://github.com/unjs/citty/pull/194))

### 💅 Refactors

- Show error once ([#167](https://github.com/unjs/citty/pull/167))
- More strict types ([f597897](https://github.com/unjs/citty/commit/f597897))
- ⚠️  Use `node:util.parseArgs` for arg parsing ([#218](https://github.com/unjs/citty/pull/218))
- Use simple console formatting ([#219](https://github.com/unjs/citty/pull/219))

### 📦 Build

- ⚠️  Esm-only dist ([42b57b0](https://github.com/unjs/citty/commit/42b57b0))

### 🏡 Chore

- Use automd for badges ([b8371c4](https://github.com/unjs/citty/commit/b8371c4))
- Apply automated lint fixes ([34c52a2](https://github.com/unjs/citty/commit/34c52a2))
- Fix typos ([#143](https://github.com/unjs/citty/pull/143))
- Update repo ([d1ed3b4](https://github.com/unjs/citty/commit/d1ed3b4))
- Fix ci script ([e13cb1e](https://github.com/unjs/citty/commit/e13cb1e))
- Apply automated updates ([3838771](https://github.com/unjs/citty/commit/3838771))
- Add vitest.config ([eb5c799](https://github.com/unjs/citty/commit/eb5c799))
- Update dependencies ([5d0a84e](https://github.com/unjs/citty/commit/5d0a84e))
- Remove extra file ([b90a84a](https://github.com/unjs/citty/commit/b90a84a))

### ✅ Tests

- Add unit tests for internal utils ([#77](https://github.com/unjs/citty/pull/77))
- Add test for args ([#160](https://github.com/unjs/citty/pull/160))
- Add test for runMain ([#162](https://github.com/unjs/citty/pull/162))
- Add test for usage ([#161](https://github.com/unjs/citty/pull/161))
- Add test for parser ([#192](https://github.com/unjs/citty/pull/192))
- Add test for subcommand ([#191](https://github.com/unjs/citty/pull/191))

#### ⚠️ Breaking Changes

- ⚠️  Parsed optionals and enum type safety ([#174](https://github.com/unjs/citty/pull/174))
- ⚠️  Conditionally print negative boolean argument usage ([#177](https://github.com/unjs/citty/pull/177))
- ⚠️  Use `node:util.parseArgs` for arg parsing ([#218](https://github.com/unjs/citty/pull/218))
- ⚠️  Esm-only dist ([42b57b0](https://github.com/unjs/citty/commit/42b57b0))

### ❤️ Contributors

- Pooya Parsa ([@pi0](https://github.com/pi0))
- Kricsleo ([@kricsleo](https://github.com/kricsleo))
- Kanon ([@ysknsid25](https://github.com/ysknsid25))
- Bobbie Goede <bobbiegoede@gmail.com>
- Estéban ([@Barbapapazes](https://github.com/Barbapapazes))
- IWANABETHATGUY <974153916@qq.com>
- Kentaro Suzuki <mail@sushichan.live>
- Xjccc ([@xjccc](https://github.com/xjccc))
- Zuixinwang ([@zuixinwang](https://github.com/zuixinwang))
- K-Sato <satokatsuki0130@gmail.com>
- Lsh ([@peterroe](https://github.com/peterroe))

## v0.1.6

[compare changes](https://github.com/unjs/citty/compare/v0.1.5...v0.1.6)

### 🩹 Fixes

- **usage:** Render valueHint for positional args ([dbd1d92](https://github.com/unjs/citty/commit/dbd1d92))

### 🏡 Chore

- Apply automated lint fixes ([f00055d](https://github.com/unjs/citty/commit/f00055d))
- Update lockfile ([0e73aad](https://github.com/unjs/citty/commit/0e73aad))

### ❤️ Contributors

- Pooya Parsa ([@pi0](http://github.com/pi0))

## v0.1.5

[compare changes](https://github.com/unjs/citty/compare/v0.1.4...v0.1.5)

### 🚀 Enhancements

- **command:** Return result of run command ([#101](https://github.com/unjs/citty/pull/101))
- **runMain:** Support custom `showUsage` option ([#74](https://github.com/unjs/citty/pull/74))

### 🏡 Chore

- Apply automated lint fixes ([505b621](https://github.com/unjs/citty/commit/505b621))
- Format with prettier ([c4597a1](https://github.com/unjs/citty/commit/c4597a1))

### 🎨 Styles

- Format with prettier ([afea1a5](https://github.com/unjs/citty/commit/afea1a5))

### ❤️ Contributors

- Pooya Parsa ([@pi0](http://github.com/pi0))
- Estéban ([@Barbapapazes](http://github.com/Barbapapazes))
- Katerina Skroumpelou

## v0.1.4

[compare changes](https://github.com/unjs/citty/compare/v0.1.3...v0.1.4)

### 🚀 Enhancements

- Support cleanup hook ([#64](https://github.com/unjs/citty/pull/64))
- Add `createMain` utility ([#65](https://github.com/unjs/citty/pull/65))
- Support `--version` ([#67](https://github.com/unjs/citty/pull/67))

### 🩹 Fixes

- Do not throw error when no subcommand specified but main has `run` ([#58](https://github.com/unjs/citty/pull/58))

### 🏡 Chore

- Update dependencies ([be58b90](https://github.com/unjs/citty/commit/be58b90))

### ❤️ Contributors

- 三咲智子 Kevin Deng <sxzz@sxzz.moe>
- Estéban ([@Barbapapazes](http://github.com/Barbapapazes))
- Pooya Parsa ([@pi0](http://github.com/pi0))

## v0.1.3

[compare changes](https://github.com/unjs/citty/compare/v0.1.2...v0.1.3)

### 🩹 Fixes

- Allow string[] in arg signature ([#56](https://github.com/unjs/citty/pull/56))

### 🏡 Chore

- Typo in readme ([#45](https://github.com/unjs/citty/pull/45))
- Update dependencies ([f863f9d](https://github.com/unjs/citty/commit/f863f9d))

### 🤖 CI

- Use conventional commit for autofix action ([#50](https://github.com/unjs/citty/pull/50))

### ❤️ Contributors

- Pooya Parsa ([@pi0](http://github.com/pi0))
- Daniel Roe <daniel@roe.dev>
- Muhammad Mahmoud ([@MuhammadM1998](http://github.com/MuhammadM1998))

## v0.1.2

[compare changes](https://github.com/unjs/citty/compare/v0.1.1...v0.1.2)

### 🚀 Enhancements

- **usage:** Resolve sub commands for meta description ([#32](https://github.com/unjs/citty/pull/32))
- Use consola for output formatting ([bf5de7f](https://github.com/unjs/citty/commit/bf5de7f))
- **runCommand:** Allow passing custom `data` ([4abc848](https://github.com/unjs/citty/commit/4abc848))

### 🩹 Fixes

- Fix generic type issues ([#38](https://github.com/unjs/citty/pull/38))
- Handle `required: false` for positional arguments ([ab0401b](https://github.com/unjs/citty/commit/ab0401b))

### 🏡 Chore

- Lint code ([5e56aa9](https://github.com/unjs/citty/commit/5e56aa9))
- Update dependencies ([7724079](https://github.com/unjs/citty/commit/7724079))
- Update dependencies ([59aeecd](https://github.com/unjs/citty/commit/59aeecd))
- Add autofix ci ([2cfd134](https://github.com/unjs/citty/commit/2cfd134))
- Fix typo in error code ([4f2c7ca](https://github.com/unjs/citty/commit/4f2c7ca))

### ❤️  Contributors

- Pooya Parsa ([@pi0](http://github.com/pi0))
- Zuixinwang 
- Wang Yiding ([@yidingww](http://github.com/yidingww))

## v0.1.1

[compare changes](https://github.com/unjs/citty/compare/v0.1.0...v0.1.1)


### 🩹 Fixes

  - Remove sub-command name when resolving nested ([47398f1](https://github.com/unjs/citty/commit/47398f1))
  - Type untyped args as `string ([ boolean`](https://github.com/unjs/citty/commit/ boolean`))
  - Move deps to devDependencies ([#20](https://github.com/unjs/citty/pull/20))
  - Fix unspecified arg types ([d1d769b](https://github.com/unjs/citty/commit/d1d769b))

### 🏡 Chore

  - Update lockfile ([fd037e4](https://github.com/unjs/citty/commit/fd037e4))
  - Update unbuild ([0810eaa](https://github.com/unjs/citty/commit/0810eaa))
  - Update lockfile ([69adc47](https://github.com/unjs/citty/commit/69adc47))

### ❤️  Contributors

- Pooya Parsa ([@pi0](http://github.com/pi0))
- Ʀᴀʏ ([@so1ve](http://github.com/so1ve))
- 4c9582f <Pooya Parsa>

## v0.1.0

[compare changes](https://github.com/unjs/citty/compare/v0.0.2...v0.1.0)


### 🏡 Chore

  - Inline deps ([ad8cec2](https://github.com/unjs/citty/commit/ad8cec2))

### ❤️  Contributors

- Pooya Parsa ([@pi0](http://github.com/pi0))

## v0.0.2


### 🚀 Enhancements

  - `setup` hook ([#9](https://github.com/unjs/citty/pull/9))
  - Allow accessing args with camelCase or kebabCase ([#17](https://github.com/unjs/citty/pull/17))
  - Basic type inference for args ([#1](https://github.com/unjs/citty/pull/1))

### 🩹 Fixes

  - Correctly parse positional arguments ([#16](https://github.com/unjs/citty/pull/16))
  - Allow any args type for `SubCommandsDef` ([60d218d](https://github.com/unjs/citty/commit/60d218d))

### 🏡 Chore

  - Small fixes ([1f377a9](https://github.com/unjs/citty/commit/1f377a9))
  - Update pnpm ([ba75f83](https://github.com/unjs/citty/commit/ba75f83))
  - Fix build ([b7b42be](https://github.com/unjs/citty/commit/b7b42be))
  - Update deps ([b1a3f06](https://github.com/unjs/citty/commit/b1a3f06))

### ❤️  Contributors

- Pooya Parsa ([@pi0](http://github.com/pi0))
- Sebastiaan Van Arkens <sebastiaan@vanarkens.nl>

