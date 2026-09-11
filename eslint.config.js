// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    // `api/` is written by openapi-typescript-codegen and regenerated wholesale from the
    // backend's schema — every file says "do not edit" at the top. Linting it only ever
    // reported on the generator's own boilerplate, which nobody can act on without the
    // next regeneration undoing it.
    ignores: ["dist/*", "api/*"],
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
