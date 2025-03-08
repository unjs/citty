import unjs from "eslint-config-unjs";

// https://github.com/unjs/eslint-config
export default unjs({
  ignores: [
  "src/_parser.ts"
],
  rules: {
  "unicorn/no-process-exit": 0
},
});