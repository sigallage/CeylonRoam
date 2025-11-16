module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true
  },
  extends: ["eslint:recommended", "plugin:react-hooks/recommended", "prettier"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  settings: {
    react: {
      version: "detect"
    }
  },
  plugins: ["react-refresh", "@typescript-eslint"],
  ignorePatterns: ["dist", "node_modules"],
  rules: {
    "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }]
  }
};
