import unjs from "eslint-config-unjs";

export default unjs({
  ignores: ["dist", "node_modules", "src/_parser.ts", "coverage"],
  rules: {
    // https://github.com/sindresorhus/eslint-plugin-unicorn
    "unicorn/no-process-exit": 0,
  },
});
