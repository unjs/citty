import unjs from "eslint-config-unjs";

export default unjs({
  ignores: ["node_modules", "src/_parser.ts"],
  rules: {
    // https://github.com/sindresorhus/eslint-plugin-unicorn
    "unicorn/no-process-exit": 0,
  },
});
