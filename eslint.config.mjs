import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tseslint from "@typescript-eslint/eslint-plugin";
import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = [
  {
    ignores: [
      "**/node_modules/**",
      ".next/**",
      ".agent/**",
      "out/**",
      "dist/**",
      "coverage/**",
      "build/**",
      "public/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
        React: "readonly",
      },
    },
    plugins: {
      react: reactPlugin,
      "react-hooks": hooksPlugin,
      "@next/next": nextPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs["jsx-runtime"].rules,
      ...hooksPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  // Node.js globals for server-side code
  {
    files: [
      "scripts/**/*.{js,ts}",
      "vendor/**/*.js",
      "prisma/**/*.ts",
      "app/**/*.{ts,tsx}",
      "lib/**/*.{ts,js}",
      "hooks/**/*.ts",
      "components/**/*.{ts,tsx}",
      "auth.ts",
      "auth.config.ts",
      "middleware.ts",
      "next.config.ts",
      "proxy.ts",
      "jest.config.js",
      "__tests__/**/*.{ts,tsx,js,jsx}",
      "**/*.test.{ts,tsx,js,jsx}",
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react/prop-types": "off",
      "react/no-unknown-property": ["error", { ignore: ["jsx"] }],
      // Turn off strict React 19 rules that are too aggressive for Next.js patterns
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/no-access-state-in-render": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/static-components": "off",
    },
  },
  {
    files: ["**/*.test.{ts,tsx,js,jsx}", "**/__tests__/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
];

export default config;


