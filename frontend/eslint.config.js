// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      "dist/*",
      "node_modules/*",
      ".expo/*",
      "config/__tests__/*",
      "components/ui/vocabulary/*",
      "hooks/*",
      "lib/limits/*",
      "services/*",
      "lib/notification-starter.tsx"
    ],
    rules: {
      "import/no-unresolved": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-require-imports": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
      "react-hooks/exhaustive-deps": "warn"
    }
  }
]);
