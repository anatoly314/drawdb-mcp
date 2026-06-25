import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

export default [
  { ignores: ["dist/**", "node_modules/**"] },

  // Pin the React version explicitly (global so it applies to every file the
  // react rules touch, including root config files). eslint-plugin-react@7.37's
  // auto-detect ('detect') path calls context.getFilename(), which ESLint 10
  // removed, and crashes; an explicit version skips detection entirely and also
  // silences the "React version not specified" notice.
  {
    settings: {
      react: { version: "19" },
    },
  },

  js.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  reactHooks.configs.flat["recommended-latest"],
  prettierConfig,
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "react-refresh": reactRefresh,
    },
    rules: {
      "react/prop-types": "off",

      // react-refresh: each context now lives as a component-only Provider
      // (src/context/FooContextProvider.jsx) paired with a plain module that
      // holds the createContext() object plus any constants/hooks
      // (src/context/FooContext.js). With components and non-components split
      // across files, Fast Refresh is satisfied. allowConstantExport lets a
      // module also export simple consts (e.g. defaultSettings) alongside a
      // component without warning.
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      // eslint-plugin-react-hooks@7's recommended-latest config newly enables
      // the React Compiler rule suite (the v4 setup only had rules-of-hooks +
      // exhaustive-deps). The sources these rules flagged have been fixed, so
      // they are kept ON as errors:
      //   - react-hooks/refs: Relationship.jsx no longer reads ref.current
      //     during render; SVG geometry is measured in a useLayoutEffect after
      //     commit and rendered from state.
      //   - react-hooks/set-state-in-effect: on-mount/external-source loads now
      //     either derive during render, use a lazy useState initializer, or
      //     run their setState inside deferred promise callbacks.
      //   - react-hooks/immutability: mutable cross-render containers moved from
      //     memo/render-scoped values to refs (Canvas.jsx, Versions.jsx).
      //   - preserve-caught-error: re-thrown errors now carry { cause }.
      "react-hooks/refs": "error",
      "react-hooks/set-state-in-effect": "error",
      "react-hooks/immutability": "error",
      "preserve-caught-error": "error",
    },
  },
];
