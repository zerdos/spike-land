import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
    include: ["../../.tests/spike-db/**/*.test.ts"],
      name: "spike-db",
      coverage: {
        exclude: ["src/**/*.test.ts", "src/**/index.ts"],
      },
    },
  }),
);
