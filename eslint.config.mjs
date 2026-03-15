// eslint.config.mjs
import js from "@eslint/js";
import globals from "globals";

export default [
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-undef": "error",
      "no-useless-escape": "error",
      "no-control-regex": "error",
      "no-useless-assignment": "error",
    },
  },
  js.configs.recommended,
];
