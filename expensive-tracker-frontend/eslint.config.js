// @ts-check
const eslint = require("@eslint/js");
const { defineConfig } = require("eslint/config");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = defineConfig([
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],

      // This codebase had never been linted, so the first run reported ~380
      // problems. The two below account for over half of them and are stylistic
      // migrations rather than defects, so they are warnings: the gate stays
      // meaningful (errors must be zero) while the debt stays visible.
      //
      //   prefer-inject      — constructor injection still works; migrate with
      //                        `ng generate @angular/core:inject`
      //   no-explicit-any    — worth typing properly, file by file
      "@angular-eslint/prefer-inject": "warn",
      "@typescript-eslint/no-explicit-any": "warn",

      // Unused code is not style — it is usually a leftover or a mistake.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Specs legitimately use `any` for stubs and partial fixtures.
    files: ["**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility,
    ],
    rules: {},
  }
]);
