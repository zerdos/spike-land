import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: "js.spike.land",
      include: ["../../.tests/transpile/**/*.{test,spec}.ts"],
    },
  }),
);
