// @ts-check
import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";

const tsRules = {
  ...tsPlugin.configs.recommended.rules,
  "no-undef": "off",
  "@typescript-eslint/no-unused-vars": [
    "error",
    { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
  ],
  "@typescript-eslint/no-explicit-any": "warn",
  "@typescript-eslint/restrict-template-expressions": "off",
  "no-console": ["error", { allow: ["error", "warn"] }],
};

const tsLanguageOptions = {
  parser: tsParser,
  parserOptions: {
    project: "./tsconfig.eslint.json",
  },
  globals: globals.node,
};

/** @type {import("eslint").Linter.Config[]} */
export default [
  { ignores: ["dist/", "node_modules/", "coverage/"] },
  {
    files: ["src/**/*.ts"],
    plugins: { "@typescript-eslint": tsPlugin },
    languageOptions: tsLanguageOptions,
    rules: {
      ...js.configs.recommended.rules,
      ...tsRules,
    },
  },
  {
    files: ["tests/**/*.ts"],
    plugins: { "@typescript-eslint": tsPlugin },
    languageOptions: tsLanguageOptions,
    rules: {
      ...js.configs.recommended.rules,
      ...tsRules,
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/await-thenable": "off",
      "@typescript-eslint/no-base-to-string": "off",
    },
  },
];
