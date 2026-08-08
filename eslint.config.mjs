// @ts-check
/**
 * Lint configuration — deliberately narrow.
 *
 * `pnpm lint` existed but ran nothing (pending P5). The goal here is to catch bug
 * classes that neither `tsc` nor the tests can see, not to add a wall of style
 * noise that gets silenced later.
 *
 * Not enabled on purpose, to avoid duplicating a control that already exists:
 *  - unused variables → `noUnusedLocals` / `noUnusedParameters` in tsconfig.base
 *  - forbidden cross-layer imports → `pnpm check:layers`
 *  - disabled tests and type suppressions → `pnpm check:shortcuts`
 */
import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "playwright-report/**",
      "test-results/**",
      "blob-report/**",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    rules: {
      // tsc already reports these; a second reporter only adds noise.
      "@typescript-eslint/no-unused-vars": "off",
      // Rule 20 §1: `any` needs a justification, so make it visible.
      "@typescript-eslint/no-explicit-any": "error",
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-var": "error",
      "prefer-const": "error",
      "no-implicit-coercion": "error",
    },
  },

  /**
   * Type-aware rules only where they pay for themselves. Full
   * `recommendedTypeChecked` floods a Three.js codebase with unsafe-* reports;
   * these two catch real defects instead: a promise nobody awaits looks like
   * finished work, and an async function passed where a void one is expected
   * silently swallows failures.
   */
  {
    files: ["packages/*/src/**/*.ts", "apps/web/src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/require-await": "error",
    },
  },

  /**
   * The highest-value rules in this repo: 15 useEffect and no useMemo. A missing
   * dependency is the usual cause of "the view does not update until I move the
   * camera", and neither types nor unit tests can see it.
   */
  {
    files: ["apps/web/src/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
    },
  },

  // Outside every package tsconfig, so no type-aware rules here.
  {
    files: ["e2e/**/*.ts", "scripts/**/*.mjs", "*.mjs", "*.config.ts"],
    languageOptions: {
      globals: { console: "readonly", process: "readonly" },
    },
  },
);
