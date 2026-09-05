// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    rules: {
      "no-restricted-imports": ["error", {
        paths: [{
          name: "react-native",
          importNames: ["Modal"],
          message: "Use @/components/reusable/AppModal instead, so toasts render above the modal rather than behind it.",
        }],
      }],
    },
  },
]);
