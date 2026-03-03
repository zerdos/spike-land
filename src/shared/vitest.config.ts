import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: "shared",
      include: ["../../.tests/shared/**/*.test.ts"],
      coverage: {
        reporter: ["text-summary"],
        include: ["src/constants/**/*.ts", "src/validations/**/*.ts", "src/utils/**/*.ts"],
        exclude: ["src/**/*.d.ts", "src/**/*.test.ts", "src/index.ts", "src/types/**/*.ts"],
      },
    },
  }),
);
